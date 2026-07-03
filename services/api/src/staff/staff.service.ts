import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, EmploymentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(outletId?: string) {
    const where: any = {};
    if (outletId) where.outletId = outletId;

    return this.prisma.staff.findMany({
      where,
      include: {
        role: true,
        department: true,    // ← TAMBAH
        outlet: true,        // ← TAMBAH
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,    // ← TAMBAH
        outlet: true,        // ← TAMBAH
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
        email: true,           // ← TAMBAH
        pin: true,
        role: true,
        isSuperAdmin: true,    // ← TAMBAH
        isActive: true,
        employmentType: true,
        outletId: true,        // ← TAMBAH
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.staff.findFirst({
      where: { email, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,        // ← untuk auth comparison
        role: true,
        isSuperAdmin: true,
        isActive: true,
        outletId: true,
      },
    });
  }

  async create(data: {
    name: string;
    pin: string;
    email?: string;
    password?: string;
    phone?: string;            
    roleId?: string;
    isSuperAdmin?: boolean;    
    isActive?: boolean;
    employmentType?: string;
    hourlyRate?: number;
    monthlySalary?: number;
    customEpfRate?: number;
    customSocsoRate?: number;
    departmentId?: string;     
    outletId?: string;         
  }) {
    const { outletId, departmentId, roleId, ...rest } = data;
    const payload = {
      ...rest,
      password: rest.password ? await bcrypt.hash(rest.password, 10) : undefined,
    };
    
    return this.prisma.staff.create({
      data: {
        ...payload,
        outlet: outletId ? { connect: { id: outletId } } : undefined,
        department: departmentId ? { connect: { id: departmentId } } : undefined,
        role: roleId ? { connect: { id: roleId } } : undefined,
      } as any,  // cast untuk bypass type check sementara
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    pin: string;
    email?: string;
    password?: string;
    phone?: string;
    roleId?: string;
    isSuperAdmin: boolean;
    isActive: boolean;
    employmentType: string;
    hourlyRate: number;
    monthlySalary: number;
    customEpfRate: number;
    customSocsoRate: number;
    departmentId: string;
    outletId: string;
  }>) {
    const { outletId, departmentId, roleId, ...rest } = data;
    const payload = {
      ...rest,
      password: rest.password ? await bcrypt.hash(rest.password, 10) : undefined,
    };
    
    return this.prisma.staff.update({
      where: { id },
      data: {
        ...payload,
        outlet: outletId 
          ? { connect: { id: outletId } } 
          : outletId === null 
            ? { disconnect: true } 
            : undefined,
        department: departmentId 
          ? { connect: { id: departmentId } } 
          : departmentId === null 
            ? { disconnect: true } 
            : undefined,
        role: roleId 
          ? { connect: { id: roleId } } 
          : roleId === null 
            ? { disconnect: true } 
            : undefined,
      } as any,
    });
  }

  async delete(id: string) {
    return this.prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
