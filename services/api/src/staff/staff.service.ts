// src/staff/staff.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, EmploymentType } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(outletId?: string) {  // ← TAMBAH parameter
    const where: any = { isActive: true };
    if (outletId) where.outletId = outletId;  // ← TAMBAH

    return this.prisma.staff.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        pin: true,
        role: true,
        isActive: true,
        employmentType: true,
        hourlyRate: true,
        monthlySalary: true,
        joinDate: true,
        customEpfRate: true,
        customSocsoRate: true,
         outletId: true,
        createdAt: true,
        updatedAt: true,
        // ❌ Exclude heavy relations
      },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        timecards: { take: 10, orderBy: { clockIn: 'desc' } },
        payrolls: { take: 5, orderBy: { periodStart: 'desc' } },
        leaveRequests: { take: 5, orderBy: { createdAt: 'desc' } },
        advances: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!staff) throw new NotFoundException(`Staff ${id} not found`);
    return staff;
  }

  async findByPin(pin: string) {
    return this.prisma.staff.findFirst({
      where: { pin, isActive: true },
      select: {
        id: true,
        name: true,
        pin: true,
        role: true,
        isActive: true,
        employmentType: true,  // ← FIXED: was missing
      },
    });
  }

  async create(data: {
    name: string;
    pin: string;
    role?: Role;
    employmentType?: EmploymentType;
    hourlyRate?: number;
    monthlySalary?: number;
  }) {
    return this.prisma.staff.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string;
    pin: string;
    role: Role;
    employmentType: EmploymentType;
    hourlyRate: number;
    monthlySalary: number;
    customEpfRate: number;
    customSocsoRate: number;
    isActive: boolean;
  }>) {
    return this.prisma.staff.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });
  }
}