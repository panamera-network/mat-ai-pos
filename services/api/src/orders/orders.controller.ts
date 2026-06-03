// src/orders/orders.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ItemStatus } from '../common/enums';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.ordersService.findAll(status as any);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Patch('items/:itemId/status')
  updateItemStatus(
    @Param('itemId') itemId: string,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateItemStatus(itemId, status as ItemStatus);
  }

  @Get('kitchen/queue')
  getKitchenQueue() {
    return this.ordersService.getKitchenQueue();
  }
}