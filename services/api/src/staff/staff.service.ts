// src/staff/staff.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, EmploymentType } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.staff.findMany({
      where: { isActive: true },
      include: { timecards: true, payrolls: true },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: { timecards: true, payrolls: true, leaveRequests: true, advances: true },
    });
    if (!staff) throw new NotFoundException(`Staff ${id} not found`);
    return staff;
  }

  async findByPin(pin: string) {
    return this.prisma.staff.findFirst({
      where: { pin, isActive: true },
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