// src/advance/advance.controller.ts
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AdvanceService } from './advance.service';

@Controller('advance')
export class AdvanceController {
  constructor(private readonly advanceService: AdvanceService) {}

  @Post()
  create(@Body() dto: {
    staffId: string;
    amount: number;
    reason?: string;
    totalInstallments?: number;
  }) {
    return this.advanceService.create(dto);
  }

  @Get('staff/:staffId')
  findByStaff(@Param('staffId') staffId: string) {
    return this.advanceService.findByStaff(staffId);
  }

  @Post(':id/deduct')
  recordDeduction(@Param('id') id: string, @Body() dto: {
    payrollId: string;
    amount: number;
  }) {
    return this.advanceService.recordDeduction(id, dto.payrollId, dto.amount);
  }
}