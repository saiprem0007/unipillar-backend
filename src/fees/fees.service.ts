import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CollegeFeeV2 {
  id: string;
  college: string;
  category: string;
  tuitionFee: number;
  semesterFee: number;
  nonRefundableOneTimePayment: number;
  hostelMessFee: number;
  refundableDeposit: number;
  totalAmount: number;
}

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<CollegeFeeV2[]> {
    return this.prisma.collegeFeeV2.findMany({
      orderBy: {
        college: 'asc',
      },
    });
  }

  async getByCollege(college: string): Promise<CollegeFeeV2[]> {
    return this.prisma.collegeFeeV2.findMany({
      where: {
        college,
      },
      orderBy: {
        category: 'asc',
      },
    });
  }

  async getCollegeNames(): Promise<{ college: string }[]> {
    return this.prisma.collegeFeeV2.findMany({
      distinct: ['college'],
      select: {
        college: true,
      },
      orderBy: {
        college: 'asc',
      },
    });
  }
}