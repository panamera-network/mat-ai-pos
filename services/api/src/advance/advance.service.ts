// src/advance/advance.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdvanceService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    staffId: string;
    amount: number;
    reason?: string;
    totalInstallments?: number;
  }) {
    const installmentAmount = data.amount / (data.totalInstallments || 1);

    return this.prisma.staffAdvance.create({
      data: {
        staffId: data.staffId,
        amount: data.amount,
        reason: data.reason,
        totalInstallments: data.totalInstallments || 1,
        installmentAmount,
      },
    });
  }

  async findByStaff(staffId: string) {
    return this.prisma.staffAdvance.findMany({
      where: { staffId },
      include: { deductions: true },
      orderBy: { takenAt: 'desc' },
    });
  }

  async recordDeduction(advanceId: string, payrollId: string, amount: number) {
    const advance = await this.prisma.staffAdvance.findUnique({
      where: { id: advanceId },
    });
    if (!advance) throw new NotFoundException(`Advance ${advanceId} not found`);

    const newPaidInstallments = advance.paidInstallments + 1;
    const isFullyPaid = newPaidInstallments >= advance.totalInstallments;

    return this.prisma.$transaction([
      this.prisma.advanceDeduction.create({
        data: { advanceId, payrollId, amount },
      }),
      this.prisma.staffAdvance.update({
        where: { id: advanceId },
        data: {
          paidInstallments: newPaidInstallments,
          isFullyPaid,
          paidOffAt: isFullyPaid ? new Date() : undefined,
        },
      }),
    ]);
  }
}