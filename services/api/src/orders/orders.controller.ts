// src/orders/orders.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: OrderStatus,
    @Query('outletId') outletId?: string,
  ) {
    return this.ordersService.findAll(status, outletId);
  }
  

  @Get('kitchen-queue')
  getKitchenQueue() {
    return this.ordersService.getKitchenQueue();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }
}
