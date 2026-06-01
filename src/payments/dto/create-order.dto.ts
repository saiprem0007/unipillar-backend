import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PlanType {
    ELITE = 'ELITE',
}

export class CreateOrderDto {
    @IsEnum(PlanType)
    plan: PlanType;

    @IsOptional()
    @IsString()
    couponCode?: string;
}
