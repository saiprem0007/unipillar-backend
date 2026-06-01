import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, PlanType } from './dto/create-order.dto';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

const PLAN_AMOUNTS: Record<PlanType, number> = {
    [PlanType.ELITE]: 59900, // ₹599 in paise
};

@Injectable()
export class PaymentsService {
    private readonly razorpay: Razorpay;
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {
        this.razorpay = new Razorpay({
            key_id: this.config.getOrThrow<string>('RAZORPAY_KEY_ID'),
            key_secret: this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET'),
        });
    }

    /** Create a Razorpay order and persist it */
    async createOrder(userId: string, dto: CreateOrderDto) {
        // Prevent duplicate active subscriptions
        const existing = await this.prisma.payment.findFirst({
            where: { userId, status: 'CAPTURED', plan: dto.plan },
        });
        if (existing) {
            throw new BadRequestException('You already have an active Elite plan.');
        }

        const amountInPaise = PLAN_AMOUNTS[dto.plan];

        let order: any;
        try {
            order = await this.razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `rcpt_${userId.slice(0, 8)}_${Date.now()}`,
                notes: { userId, plan: dto.plan },
            });
        } catch (err) {
            this.logger.error('Razorpay order creation failed', err);
            throw new InternalServerErrorException('Could not initiate payment. Try again.');
        }

        // Persist the order in a PENDING state
        await this.prisma.payment.create({
            data: {
                userId,
                razorpayOrderId: order.id,
                amount: amountInPaise,
                currency: 'INR',
                plan: dto.plan,
                status: 'PENDING',
            },
        });

        return {
            orderId: order.id,
            amount: amountInPaise,
            currency: 'INR',
            keyId: this.config.getOrThrow<string>('RAZORPAY_KEY_ID'),
        };
    }

    /** Verify payment signature and activate the plan */
    async verifyPayment(
        userId: string,
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string,
    ) {
        const secret = this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET');

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            throw new BadRequestException('Payment verification failed: invalid signature.');
        }

        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId },
        });

        if (!payment || payment.userId !== userId) {
            throw new BadRequestException('Order not found or unauthorized.');
        }

        if (payment.status === 'CAPTURED') {
            return { success: true, alreadyActivated: true };
        }

        // Mark payment captured & activate the plan on the user
        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { razorpayOrderId },
                data: { status: 'CAPTURED', razorpayPaymentId },
            }),
            this.prisma.user.update({
                where: { id: userId },
                data: { isPremium: true, userType: 'premium' },
            }),
        ]);

        return { success: true, alreadyActivated: false };
    }

    /** Razorpay webhook — called by Razorpay servers directly (no auth guard) */
    async handleWebhook(rawBody: Buffer, signature: string) {
        const secret = this.config.getOrThrow<string>('RAZORPAY_WEBHOOK_SECRET');

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        if (expectedSignature !== signature) {
            this.logger.warn('Webhook signature mismatch — ignoring.');
            return { received: false };
        }

        const event = JSON.parse(rawBody.toString());
        const eventType: string = event.event;

        if (eventType === 'payment.captured') {
            const paymentEntity = event.payload.payment.entity;
            const orderId: string = paymentEntity.order_id;
            const paymentId: string = paymentEntity.id;

            const existing = await this.prisma.payment.findUnique({
                where: { razorpayOrderId: orderId },
            });

            if (existing && existing.status !== 'CAPTURED') {
                await this.prisma.$transaction([
                    this.prisma.payment.update({
                        where: { razorpayOrderId: orderId },
                        data: { status: 'CAPTURED', razorpayPaymentId: paymentId },
                    }),
                    this.prisma.user.update({
                        where: { id: existing.userId },
                        data: { isPremium: true, userType: 'premium' },
                    }),
                ]);
                this.logger.log(`Webhook: activated premium for user ${existing.userId}`);
            }
        }

        if (eventType === 'payment.failed') {
            const orderId: string = event.payload.payment.entity.order_id;
            await this.prisma.payment.updateMany({
                where: { razorpayOrderId: orderId, status: 'PENDING' },
                data: { status: 'FAILED' },
            });
        }

        return { received: true };
    }
}
