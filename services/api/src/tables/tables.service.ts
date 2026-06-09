// src/tables/tables.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.table.findMany({
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
    return this.prisma.table.findUnique({
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
    return this.prisma.table.create({ data });
  }

  update(id: string, data: Partial<{ number: string; capacity: number; status: TableStatus }>) {
    return this.prisma.table.update({ where: { id }, data });
  }

  async delete(id: string) {
    const table = await this.prisma.table.findUnique({ 
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
    
    return this.prisma.table.delete({ where: { id } });
  }

  async updateStatus(id: string, status: TableStatus) {
    return this.prisma.table.update({
      where: { id },
      data: { status },
    });
  }
}