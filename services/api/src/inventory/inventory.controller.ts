// src/inventory/inventory.controller.ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getCurrentStock() {
    return this.inventoryService.getCurrentStock();
  }

  @Get('low-stock')
  getLowStock() {
    return this.inventoryService.getLowStock();
  }

  @Get('logs')
  getLogs(
    @Query('menuItemId') menuItemId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.inventoryService.getLogs({
      menuItemId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      staffId,
    });
  }

  @Post('manual-in')
  manualStockIn(@Body() dto: {
    menuItemId: string;
    quantity: number;
    staffId: string;
    reason?: string;
  }) {
    return this.inventoryService.manualStockIn(dto.menuItemId, dto.quantity, dto.staffId, dto.reason);
  }

  @Post('adjust')
  adjustStock(@Body() dto: {
    menuItemId: string;
    newStock: number;
    staffId: string;
    reason: string;
  }) {
    return this.inventoryService.adjustStock(dto.menuItemId, dto.newStock, dto.staffId, dto.reason);
  }
}