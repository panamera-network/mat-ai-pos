// src/inventory/inventory.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockType } from '@prisma/client';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ─── RAW MATERIAL ───

  async create(dto: CreateInventoryItemDto) {
  return this.prisma.inventoryItem.create({
    data: dto,
  });
}

  async getInventoryItems(category?: string) {
    return this.prisma.inventoryItem.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getLowStockInventory() {
    const items = await this.prisma.inventoryItem.findMany({
      orderBy: [{ currentStock: 'asc' }],
    });
    return items.filter(item => item.currentStock <= item.minStock);
  }

  async stockInInventory(inventoryItemId: string, qty: number, staffId: string, reason?: string) {
    const item = await this.prisma.inventoryItem.findUnique({ 
      where: { id: inventoryItemId },
      include: { ingredients: { include: { menuItem: true } } }
    });
    
    if (!item) throw new Error('Inventory item not found');

    const previousStock = item.currentStock;

    const [updated, log] = await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { currentStock: { increment: qty } },
      }),
      this.prisma.stockLog.create({
        data: {
          type: StockType.MANUAL_IN,
          inventoryItemId,
          quantity: qty,
          reason: reason || 'Stock in',
          staffId,
        },
      }),
    ]);

    // Re-enable menu items if possible
    for (const ing of item.ingredients) {
      await this.checkAndEnableMenuItem(ing.menuItemId);
    }

    return { item: updated, log, previousStock, newStock: previousStock + qty };
  }

  // ─── MENU STOCK ───

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

  async getLowStockMenu() {
    return this.prisma.menuItem.findMany({
      where: {
        stock: { lte: this.prisma.menuItem.fields.minStock },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        isAvailable: true,
        category: { select: { name: true } },
      },
    });
  }

  // ─── AUTO DEDUCT ───

  async autoDeductInventory(menuItemId: string, orderQty: number, orderId: string) {
    const ingredients = await this.prisma.menuItemIngredient.findMany({
      where: { menuItemId },
      include: { inventoryItem: true },
    });

    if (ingredients.length === 0) return;

    const deductions = ingredients.map(ing => ({
      inventoryItemId: ing.inventoryItemId,
      qty: ing.quantityUsed * orderQty,
    }));

    // Check stock
    for (const d of deductions) {
      const item = await this.prisma.inventoryItem.findUnique({ where: { id: d.inventoryItemId } });
      if (item && item.currentStock < d.qty) {
        throw new Error(`Insufficient stock: ${item.name} (need ${d.qty}, have ${item.currentStock})`);
      }
    }

    // Deduct
    await this.prisma.$transaction(
      deductions.map(d => 
        this.prisma.inventoryItem.update({
          where: { id: d.inventoryItemId },
          data: { currentStock: { decrement: d.qty } },
        })
      )
    );

    // Log (no staffId for auto)
    await this.prisma.stockLog.createMany({
      data: deductions.map(d => ({
        type: StockType.AUTO_DEDUCT,
        inventoryItemId: d.inventoryItemId,
        quantity: d.qty,
        orderId,
        reason: 'Auto deduct from order',
      })),
    });
  }

  // ─── CHECK & UPDATE AVAILABILITY ───

  async checkAndDisableMenuItem(menuItemId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { ingredients: { include: { inventoryItem: true } } },
    });

    if (!menuItem) return;

    let shouldDisable = false;
    
    if (menuItem.stock <= 0) shouldDisable = true;

    for (const ing of menuItem.ingredients) {
      if (ing.inventoryItem.currentStock < ing.quantityUsed) {
        shouldDisable = true;
        break;
      }
    }

    if (shouldDisable && menuItem.isAvailable) {
      await this.prisma.menuItem.update({
        where: { id: menuItemId },
        data: { isAvailable: false },
      });
      console.log(`⚠️ Disabled: ${menuItem.name}`);
    }

    return shouldDisable;
  }

  async checkAndEnableMenuItem(menuItemId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { ingredients: { include: { inventoryItem: true } } },
    });

    if (!menuItem || menuItem.isAvailable) return;

    let canEnable = true;
    
    if (menuItem.stock <= 0) canEnable = false;

    for (const ing of menuItem.ingredients) {
      if (ing.inventoryItem.currentStock < ing.quantityUsed) {
        canEnable = false;
        break;
      }
    }

    if (canEnable) {
      await this.prisma.menuItem.update({
        where: { id: menuItemId },
        data: { isAvailable: true },
      });
      console.log(`✅ Enabled: ${menuItem.name}`);
    }

    return canEnable;
  }

  // ─── LOGS ───

  async getLogs(options?: { inventoryItemId?: string; menuItemId?: string; from?: Date; to?: Date }) {
    const where: any = {};
    if (options?.inventoryItemId) where.inventoryItemId = options.inventoryItemId;
    if (options?.menuItemId) where.menuItemId = options.menuItemId;
    if (options?.from || options?.to) {
      where.createdAt = {};
      if (options.from) where.createdAt.gte = options.from;
      if (options.to) where.createdAt.lte = options.to;
    }

    return this.prisma.stockLog.findMany({
      where,
      include: { 
        inventoryItem: true, 
        menuItem: true,
        staff: { select: { name: true } } 
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}