// src/timecard/timecard.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TimecardService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async clockIn(staffId: string) {
    // Check if already clocked in
    const active = await this.prisma.timecard.findFirst({
      where: { staffId, clockOut: null },
    });

    if (active) {
      throw new ConflictException('Already clocked in. Please clock out first.');
    }

    return this.prisma.timecard.create({
      data: { staffId, clockIn: new Date() },
    });
  }

  async clockOut(staffId: string) {
    const timecard = await this.prisma.timecard.findFirst({
      where: { staffId, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });

    if (!timecard) {
      throw new NotFoundException('No active clock-in found.');
    }

    const clockOut = new Date();
    const totalMinutes = Math.floor((clockOut.getTime() - timecard.clockIn.getTime()) / 60000) - timecard.breakMinutes;
    const totalHours = parseFloat((totalMinutes / 60).toFixed(2));

    return this.prisma.timecard.update({
      where: { id: timecard.id },
      data: { clockOut, totalMinutes, totalHours },
    });
  }

  async findByStaff(staffId: string, options?: { from?: Date; to?: Date }) {
    const where: Prisma.TimecardWhereInput = { staffId };
    if (options?.from || options?.to) {
      where.clockIn = {};
      if (options.from) where.clockIn.gte = options.from;
      if (options.to) where.clockIn.lte = options.to;
    }

    return this.prisma.timecard.findMany({
      where,
      orderBy: { clockIn: 'desc' },
    });
  }

  async findAll(options?: { from?: Date; to?: Date }) {
  const where: Prisma.TimecardWhereInput = {};
  if (options?.from || options?.to) {
    where.clockIn = {};
    if (options.from) where.clockIn.gte = options.from;
    if (options.to) where.clockIn.lte = options.to;
  }

  return this.prisma.timecard.findMany({
    where,
    include: { staff: { select: { name: true, department: true } } },
    orderBy: { clockIn: 'desc' },
  });
}

  async verify(id: string, verifiedBy: string) {
    return this.prisma.timecard.update({
      where: { id },
      data: { verifiedBy, verifiedAt: new Date() },
    });
  }

  async update(id: string, data: { clockIn?: string; clockOut?: string | null; breakMinutes?: number }) {
    const timecard = await this.prisma.timecard.findUnique({ where: { id } });
    if (!timecard) throw new NotFoundException('Timecard not found.');

    const clockIn = data.clockIn ? new Date(data.clockIn) : timecard.clockIn;
    const clockOut = data.clockOut === null ? null : data.clockOut ? new Date(data.clockOut) : timecard.clockOut;
    const breakMinutes = Number(data.breakMinutes ?? timecard.breakMinutes ?? 0);

    let totalMinutes: number | null = null;
    let totalHours: number | null = null;
    if (clockOut) {
      totalMinutes = Math.max(0, Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000) - breakMinutes);
      totalHours = parseFloat((totalMinutes / 60).toFixed(2));
    }

    return this.prisma.timecard.update({
      where: { id },
      data: {
        clockIn,
        clockOut,
        breakMinutes,
        totalMinutes,
        totalHours,
      },
      include: { staff: { select: { name: true, department: true } } },
    });
  }

  async getWeeklyHours(staffId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const timecards = await this.prisma.timecard.findMany({
      where: {
        staffId,
        clockIn: { gte: weekStart, lt: weekEnd },
        clockOut: { not: null },
      },
    });

    return timecards.reduce((sum, t) => sum + Number(t.totalHours || 0), 0);  // ← FIXED: Number()
  }
}
