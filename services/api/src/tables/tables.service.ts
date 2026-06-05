// src/tables/tables.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.table.findMany({
      orderBy: { number: 'asc' },
      include: { orders: { where: { status: { in: ['PENDING', 'PAID', 'PREPARING'] } } } },
    });
  }

  findOne(id: string) {
    return this.prisma.table.findUnique({
      where: { id },
      include: { orders: true },
    });
  }

  create(data: { number: string; capacity?: number }) {
    return this.prisma.table.create({ data });
  }

  update(id: string, data: Partial<{ number: string; capacity: number; status: TableStatus }>) {
    return this.prisma.table.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.table.delete({ where: { id } });
  }

  async updateStatus(id: string, status: TableStatus) {
    return this.prisma.table.update({
      where: { id },
      data: { status },
    });
  }
}