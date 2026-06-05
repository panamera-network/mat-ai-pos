// src/orders/orders.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus, ItemStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: any) {
    return this.ordersService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(status);
  }

  @Get('kitchen/queue')
  getKitchenQueue() {
    return this.ordersService.getKitchenQueue();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<{
    status: OrderStatus;
    paidAmount: number;
    paymentMethod: string;
    notes: string;
  }>) {
    return this.ordersService.update(id, dto);
  }

  @Patch('items/:itemId/status')
  updateItemStatus(
    @Param('itemId') itemId: string,
    @Body('status') status: ItemStatus,
  ) {
    return this.ordersService.updateItemStatus(itemId, status);
  }
}