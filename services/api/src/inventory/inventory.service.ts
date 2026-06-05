// src/inventory/inventory.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getCurrentStock() {
    return this.prisma.menuItem.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        isAvailable: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
    });
  }

  async getLowStock() {
    return this.prisma.menuItem.findMany({
      where: {
        stock: { lte: this.prisma.menuItem.fields.minStock },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        category: { select: { name: true } },
      },
    });
  }

  async getLogs(options?: { menuItemId?: string; from?: Date; to?: Date; staffId?: string }) {
    const where: any = {};
    if (options?.menuItemId) where.menuItemId = options.menuItemId;
    if (options?.staffId) where.staffId = options.staffId;
    if (options?.from || options?.to) {
      where.createdAt = {};
      if (options.from) where.createdAt.gte = options.from;
      if (options.to) where.createdAt.lte = options.to;
    }

    return this.prisma.stockLog.findMany({
      where,
      include: { menuItem: true, staff: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async manualStockIn(menuItemId: string, quantity: number, staffId: string, reason?: string) {
    return this.prisma.$transaction([
      this.prisma.menuItem.update({
        where: { id: menuItemId },
        data: { stock: { increment: quantity } },
      }),
      this.prisma.stockLog.create({
        data: {
          menuItemId,
          type: 'MANUAL_IN',
          quantity,
          reason,
          staffId,
        },
      }),
    ]);
  }

  async adjustStock(menuItemId: string, newStock: number, staffId: string, reason: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: menuItemId } });
    const difference = newStock - (item?.stock || 0);

    return this.prisma.$transaction([
      this.prisma.menuItem.update({
        where: { id: menuItemId },
        data: { stock: newStock },
      }),
      this.prisma.stockLog.create({
        data: {
          menuItemId,
          type: 'ADJUSTMENT',
          quantity: difference,
          reason,
          staffId,
        },
      }),
    ]);
  }
}