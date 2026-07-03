// src/inventory/inventory.controller.ts
import { Controller, Get, Post, Body, Param, Query, Put, Inject, forwardRef, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CostingService } from '../costing/costing.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { StockInDto } from './dto/stock-in.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    @Inject(forwardRef(() => CostingService))
    private readonly costingService: CostingService,
  ) {}

  // Root path — return all items
  @Get()
  getAll(
    @Query('category') category?: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.inventoryService.getInventoryItems(category, outletId);
  }

  @Put(':id/unit-price')
  async updateUnitPrice(
    @Param('id') id: string,
    @Body('unitPrice') unitPrice: number,
  ) {
    const updated = await this.inventoryService.update(id, { unitPrice });
    await this.costingService.recalculateAllMenuCosts();
    return updated;
  }

  @Get('items')
  getInventoryItems(
    @Query('category') category?: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.inventoryService.getInventoryItems(category, outletId);
  }

  @Get('items/low-stock')
  getLowStockInventory(@Query('outletId') outletId?: string) {
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
    @Query('outletId') outletId?: string,
  ) {
    return this.inventoryService.getLogs({
      inventoryItemId,
      menuItemId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      outletId,
    });
  }
}
