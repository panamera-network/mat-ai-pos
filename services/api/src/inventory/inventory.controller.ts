// src/inventory/inventory.controller.ts
import { Controller, Get, Post, Body, Param, Query, Put } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { StockInDto } from './dto/stock-in.dto';

@Controller('inventory')
export class InventoryController {
  costingService: any;
  constructor(private readonly inventoryService: InventoryService) {}

  @Put(':id/unit-price')
  async updateUnitPrice(
    @Param('id') id: string,
    @Body('unitPrice') unitPrice: number,
  ) {
    const updated = await this.inventoryService.update(id, { unitPrice });

    // Trigger cost recalculation for all affected menu items
    await this.costingService.recalculateAllMenuCosts();

    return updated;
  }
  
  @Get('items')
  getInventoryItems(
    @Query('category') category?: string,
    @Query('outletId') outletId?: string,  // ← TAMBAH
  ) {
    return this.inventoryService.getInventoryItems(category, outletId);
  }

  @Get('items/low-stock')
  getLowStockInventory(@Query('outletId') outletId?: string) {  // ← TAMBAH
    return this.inventoryService.getLowStockInventory(outletId);
  }

  @Post('items')
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Post('items/:id/stock-in')
  stockInInventory(
    @Param('id') id: string,
    @Body() dto: StockInDto
  ) {
    return this.inventoryService.stockInInventory(id, dto.qty, dto.staffId, dto.reason);
  }

  @Get('menu-stock')
  getCurrentStock() {
    return this.inventoryService.getCurrentStock();
  }

  @Get('menu-stock/low-stock')
  getLowStockMenu() {
    return this.inventoryService.getLowStockMenu();
  }

  @Get('logs')
  getLogs(
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('menuItemId') menuItemId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('outletId') outletId?: string,  // ← TAMBAH
  ) {
    return this.inventoryService.getLogs({
      inventoryItemId,
      menuItemId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      outletId,  // ← TAMBAH
    });
  }
}