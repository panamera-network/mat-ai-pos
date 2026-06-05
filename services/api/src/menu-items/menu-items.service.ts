// src/menu-items/menu-items.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuItemsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { category: true },
    });
  }

  findOne(id: string) {
    return this.prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  create(data: {
    name: string;
    price: number;
    categoryId: string;
    imageUrl?: string;
    stock?: number;
    minStock?: number;
    options?: any;
  }) {
    return this.prisma.menuItem.create({ data });
  }

  update(id: string, data: Partial<{
    name: string;
    price: number;
    categoryId: string;
    imageUrl: string;
    isAvailable: boolean;
    stock: number;
    minStock: number;
    options: any;
  }>) {
    return this.prisma.menuItem.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false },
    });
  }

  async updateStock(id: string, quantity: number, type: 'in' | 'out' | 'adjust', staffId: string, reason?: string) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`Menu item ${id} not found`);

    const newStock = type === 'in' ? item.stock + quantity : 
                     type === 'out' ? item.stock - quantity : quantity;

    return this.prisma.$transaction([
      this.prisma.menuItem.update({
        where: { id },
        data: { stock: newStock },
      }),
      this.prisma.stockLog.create({
        data: {
          menuItemId: id,
          type: type === 'in' ? 'MANUAL_IN' : type === 'out' ? 'AUTO_DEDUCT' : 'ADJUSTMENT',
          quantity: type === 'out' ? -quantity : quantity,
          reason,
          staffId,
        },
      }),
    ]);
  }
}