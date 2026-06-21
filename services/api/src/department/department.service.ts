import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      include: { _count: { select: { staff: true } } },
    });
  }

  async findOne(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: { staff: true },
    });
  }

  async create(data: { name: string }) {
    return this.prisma.department.create({ data: { name: data.name } });
  }

  async update(id: string, data: { name?: string; isActive?: boolean }) {
    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}