// src/menu-items/menu-items.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { MenuItemsService } from './menu-items.service';

@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Get()
  findAll() {
    return this.menuItemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuItemsService.findOne(id);
  }

  @Post()
  create(@Body() dto: {
    name: string;
    price: number;
    categoryId: string;
    imageUrl?: string;
    stock?: number;
    minStock?: number;
    options?: any;
  }) {
    return this.menuItemsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<{
    name: string;
    price: number;
    categoryId: string;
    imageUrl: string;
    isAvailable: boolean;
    stock: number;
    minStock: number;
    options: any;
  }>) {
    return this.menuItemsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.menuItemsService.delete(id);
  }

  @Post(':id/stock')
  updateStock(@Param('id') id: string, @Body() dto: {
    quantity: number;
    type: 'in' | 'out' | 'adjust';
    staffId: string;
    reason?: string;
  }) {
    return this.menuItemsService.updateStock(id, dto.quantity, dto.type, dto.staffId, dto.reason);
  }
}