import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  // ================= GET FULL PROFILE =================
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        josaaAllocations: {
          orderBy: { round: 'asc' },
        },
        csabAllocations: {
          orderBy: { round: 'asc' },
        },
      },
    });
  }

  // ================= UPDATE USER PROFILE =================
  async updateProfile(userId: string, data: any) {
    // 1. update USER table (name, email, mobile)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
      },
    });

    // 2. update USER PROFILE table (academic info)
    await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        category: data.category,
        gender: data.gender,
        pwd: data.pwd,
        homeState: data.homeState,
        jeeMains: data.jeeMains,
        jeeAdvanced: data.jeeAdvanced,
      },
      create: {
        userId,
        category: data.category,
        gender: data.gender,
        pwd: data.pwd,
        homeState: data.homeState,
        jeeMains: data.jeeMains,
        jeeAdvanced: data.jeeAdvanced,
      },
    });

    // 3. return fresh updated user
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        josaaAllocations: true,
        csabAllocations: true,
      },
    });
  }

  // ================= JOSAA =================
  async addJosaa(userId: string, data: any) {
    return this.prisma.josaaAllocation.create({
      data: {
        userId,
        round: Number(data.round),
        college: data.college,
        branch: data.branch,
        status: data.status,
      },
    });
  }

  async getJosaa(userId: string) {
    return this.prisma.josaaAllocation.findMany({
      where: { userId },
      orderBy: { round: 'asc' },
    });
  }

  // ================= CSAB =================
  async addCsab(userId: string, data: any) {
    return this.prisma.csabAllocation.create({
      data: {
        userId,
        round: Number(data.round),
        college: data.college,
        branch: data.branch,
        status: data.status,
      },
    });
  }

  async getCsab(userId: string) {
    return this.prisma.csabAllocation.findMany({
      where: { userId },
      orderBy: { round: 'asc' },
    });
  }
}