// src/payroll/payroll.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { PayrollPeriod, PayrollStatus } from '@prisma/client';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async generate(staffId: string, periodStart: Date, periodEnd: Date, periodType: PayrollPeriod) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { timecards: true, leaveRequests: true, advances: { where: { isFullyPaid: false } } },
    });
    if (!staff) throw new NotFoundException(`Staff ${staffId} not found`);

    // Get settings
    const epfRate = staff.customEpfRate || await this.settingsService.getNumericValue('epf_employee_rate', 11);
    const socsoRate = staff.customSocsoRate || await this.settingsService.getNumericValue('socso_employee_rate', 0.5);
    const epfEmployerRate = await this.settingsService.getNumericValue('epf_employer_rate', 13);
    const socsoEmployerRate = await this.settingsService.getNumericValue('socso_employer_rate', 1.75);
    const otMultiplier = await this.settingsService.getNumericValue('overtime_multiplier', 1.5);

    // Calculate earnings
    let basicPay = 0;
    let overtimeHours = 0;
    let overtimePay = 0;

    if (staff.employmentType === 'HOURLY_PART_TIME') {
      const timecards = staff.timecards.filter(t => 
        t.clockIn >= periodStart && 
        t.clockIn <= periodEnd && 
        t.clockOut !== null
      );
      const regularHours = timecards.reduce((sum, t) => sum + (t.totalHours || 0), 0);
      basicPay = regularHours * Number(staff.hourlyRate || 0);
    } else {
      basicPay = Number(staff.monthlySalary || 0);
    }

    // Calculate deductions
    const leaveDeduction = staff.leaveRequests
      .filter(l => l.status === 'APPROVED' && l.type === 'UNPAID')
      .reduce((sum, l) => sum + (l.payrollDeduction || 0), 0);

    const epfEmployee = (basicPay * epfRate) / 100;
    const socsoEmployee = (basicPay * socsoRate) / 100;
    const epfEmployer = (basicPay * epfEmployerRate) / 100;
    const socsoEmployer = (basicPay * socsoEmployerRate) / 100;

    const advanceDeduction = staff.advances.reduce((sum, a) => sum + Number(a.installmentAmount), 0);

    const totalEarnings = basicPay + overtimePay;
    const totalDeductions = leaveDeduction + epfEmployee + socsoEmployee + advanceDeduction;
    const nettPay = totalEarnings - totalDeductions;

    return this.prisma.payroll.create({
      data: {
        staffId,
        periodStart,
        periodEnd,
        periodType,
        basicPay,
        overtimeHours,
        overtimePay,
        totalEarnings,
        leaveDeduction,
        epfEmployee,
        epfEmployer,
        socsoEmployee,
        socsoEmployer,
        advanceDeduction,
        totalDeductions,
        nettPay,
      },
    });
  }

  async findAll(options?: { staffId?: string; from?: Date; to?: Date }) {
    const where: any = {};
    if (options?.staffId) where.staffId = options.staffId;
    if (options?.from || options?.to) {
      where.periodStart = {};
      if (options.from) where.periodStart.gte = options.from;
      if (options.to) where.periodStart.lte = options.to;
    }

    return this.prisma.payroll.findMany({
      where,
      include: { staff: { select: { name: true, employmentType: true } } },
      orderBy: { periodStart: 'desc' },
    });
  }

  async findOne(id: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: { staff: true, advanceDeductions: { include: { advance: true } } },
    });
    if (!payroll) throw new NotFoundException(`Payroll ${id} not found`);
    return payroll;
  }

  async approve(id: string) {
    return this.prisma.payroll.update({
      where: { id },
      data: { status: PayrollStatus.APPROVED },
    });
  }

  async markPaid(id: string, paidBy: string) {
    return this.prisma.payroll.update({
      where: { id },
      data: { status: PayrollStatus.PAID, paidAt: new Date(), paidBy },
    });
  }
}