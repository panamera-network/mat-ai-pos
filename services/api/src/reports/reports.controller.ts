// src/reports/reports.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  salesSummary(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.salesSummary(new Date(from), new Date(to));
  }

  @Get('sales/by-item')
  salesByItem(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.salesByItem(new Date(from), new Date(to));
  }

  @Get('sales/by-category')
  salesByCategory(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.salesByCategory(new Date(from), new Date(to));
  }

  @Get('sales/by-payment')
  salesByPayment(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.salesByPayment(new Date(from), new Date(to));
  }

  @Get('sales/by-cashier')
  salesByCashier(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.salesByCashier(new Date(from), new Date(to));
  }

  @Get('sales/by-order-type')
  salesByOrderType(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.salesByOrderType(new Date(from), new Date(to));
  }

  @Get('sales/by-hour')
  hourlyBreakdown(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.hourlyBreakdown(new Date(from), new Date(to));
  }

  @Get('popular-items')
  popularItems(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.popularItems(new Date(from), new Date(to), limit ? parseInt(limit) : 10);
  }

  @Get('daily')
  dailyReport(@Query('date') date: string) {
    return this.reportsService.dailyReport(new Date(date));
  }
}