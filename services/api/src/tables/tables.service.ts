// src/tables/tables.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiningTableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.diningTable.findMany({
      orderBy: { number: 'asc' },
      include: { 
        orders: { 
          where: { status: { in: ['PENDING', 'PAID', 'PREPARING'] } },
          select: { id: true, status: true, totalAmount: true },
        } 
      },
    });
  }

  findOne(id: string) {
    return this.prisma.diningTable.findUnique({
      where: { id },
      include: { 
        orders: { 
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, status: true, totalAmount: true },
        } 
      },
    });
  }

  create(data: { number: string; capacity?: number }) {
    return this.prisma.diningTable.create({ data });
  }

  update(id: string, data: Partial<{ number: string; capacity: number; status: DiningTableStatus }>) {
    return this.prisma.diningTable.update({ where: { id }, data });
  }

  async delete(id: string) {
    const table = await this.prisma.diningTable.findUnique({ 
      where: { id },
      include: { 
        orders: { 
          where: { status: { not: 'CANCELLED' } } 
        } 
      }
    });

    if (!table) throw new NotFoundException(`Table ${id} not found`);

    if (table.orders.length > 0) {
      throw new ConflictException('Cannot delete table with active orders');
    }

    return this.prisma.diningTable.delete({ where: { id } });
  }

  async updateStatus(id: string, status: DiningTableStatus) {
    return this.prisma.diningTable.update({
      where: { id },
      data: { status },
    });
  }
}