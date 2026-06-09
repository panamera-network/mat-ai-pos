// src/inventory/inventory.controller.ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { StockInDto } from './dto/stock-in.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  getInventoryItems(@Query('category') category?: string) {
    return this.inventoryService.getInventoryItems(category);
  }

  @Get('items/low-stock')
  getLowStockInventory() {
    return this.inventoryService.getLowStockInventory();
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
  ) {
    return this.inventoryService.getLogs({
      inventoryItemId,
      menuItemId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}