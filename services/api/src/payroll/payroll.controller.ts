// src/payroll/payroll.controller.ts
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollPeriod } from '@prisma/client';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('generate')
  generate(@Body() dto: {
    staffId: string;
    periodStart: string;
    periodEnd: string;
    periodType: PayrollPeriod;
  }) {
    return this.payrollService.generate(
      dto.staffId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
      dto.periodType,
    );
  }

  @Get()
  findAll(
    @Query('staffId') staffId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('outletId') outletId?: string,  // ← TAMBAH
  ) {
    return this.payrollService.findAll({
      staffId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      outletId,  // ← TAMBAH
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.payrollService.approve(id);
  }

  @Post(':id/pay')
  markPaid(@Param('id') id: string, @Body('paidBy') paidBy: string) {
    return this.payrollService.markPaid(id, paidBy);
  }
}