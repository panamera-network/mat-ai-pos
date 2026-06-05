// src/leave/leave.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    staffId: string;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return this.prisma.leaveRequest.create({
      data: {
        staffId: data.staffId,
        type: data.type,
        startDate: start,
        endDate: end,
        days,
        reason: data.reason,
      },
    });
  }

  async findByStaff(staffId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.leaveRequest.findMany({
      where: { status: LeaveStatus.PENDING },
      include: { staff: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, approvedBy: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.APPROVED, approvedBy, approvedAt: new Date() },
    });
  }

  async reject(id: string, approvedBy: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.REJECTED, approvedBy, approvedAt: new Date() },
    });
  }
}