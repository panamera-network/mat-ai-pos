// src/menu-items/menu-items.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockType } from '@prisma/client';  // ← ADD for enum

@Injectable()
export class MenuItemsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { 
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        // ❌ Exclude: ingredients, stockLogs, orderItems
      },
    });
  }

  findOne(id: string) {
    return this.prisma.menuItem.findUnique({
      where: { id },
      include: { 
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        ingredients: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                unit: true,
                currentStock: true,
              },
            },
          },
        },
        stockLogs: {
          take: 5,  // ← last 5 logs only
          orderBy: { createdAt: 'desc' },
        },
      },
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

  async updateStock(
    id: string, 
    quantity: number, 
    type: 'in' | 'out' | 'adjust', 
    staffId?: string, 
    reason?: string
  ) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Menu item ${id} not found`);

    const newStock = type === 'in' ? item.stock + quantity : 
                     type === 'out' ? item.stock - quantity : quantity;

    // Validate stock not negative
    if (newStock < 0) throw new Error('Stock cannot be negative');

    return this.prisma.$transaction([
      this.prisma.menuItem.update({
        where: { id },
        data: { stock: newStock },
      }),
      this.prisma.stockLog.create({
        data: {
          menuItemId: id,
          type: type === 'in' ? StockType.MANUAL_IN : 
                 type === 'out' ? StockType.AUTO_DEDUCT : 
                 StockType.ADJUSTMENT,
          quantity: Math.abs(quantity),  // ← always positive
          reason: reason || `${type === 'in' ? 'Stock in' : type === 'out' ? 'Stock out' : 'Stock adjustment'}`,
          staffId: staffId || undefined,  // ← optional
        },
      }),
    ]);
  }
}