// src/discount/discount.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Get()
  async findAll(@Query('outletId') outletId?: string) {
    return this.discountService.findAll(outletId);
  }

  @Get('active')
  async findActive(@Query('outletId') outletId?: string) {
    return this.discountService.findActive(outletId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.discountService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateDiscountDto) {
    return this.discountService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.discountService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.discountService.remove(id);
  }
}