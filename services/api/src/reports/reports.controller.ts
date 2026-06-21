import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/date-range.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  salesSummary(@Query() query: DateRangeDto) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    return this.reportsService.salesSummary(from, to);
  }

  @Get('sales/by-item')
  salesByItem(@Query() query: DateRangeDto) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    return this.reportsService.salesByItem(from, to);
  }

  @Get('sales/by-category')
  salesByCategory(@Query() query: DateRangeDto) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    return this.reportsService.salesByCategory(from, to);
  }

  @Get('sales/by-payment')
  salesByPayment(@Query() query: DateRangeDto) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    return this.reportsService.salesByPayment(from, to);
  }

  @Get('sales/by-cashier')
  salesByCashier(@Query() query: DateRangeDto) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    return this.reportsService.salesByCashier(from, to);
  }

  @Get('sales/by-order-type')
  salesByOrderType(@Query() query: DateRangeDto) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    return this.reportsService.salesByOrderType(from, to);
  }

  @Get('sales/by-hour')
  hourlyBreakdown(@Query() query: DateRangeDto) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    return this.reportsService.hourlyBreakdown(from, to);
  }

  @Get('popular-items')
  popularItems(@Query() query: DateRangeDto & { limit?: string }) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    const limit = query.limit ? parseInt(query.limit) : 10;
    return this.reportsService.popularItems(from, to, limit);
  }

  @Get('daily')
  dailyReport(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.reportsService.dailyReport(targetDate);
  }

  // ==========================================
  // CSV EXPORTS
  // ==========================================

  @Get('sales/export')
  async exportSales(@Query() query: DateRangeDto, @Res() res: Response) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    const csv = await this.reportsService.exportSalesCSV(from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-report-${from.toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }

  @Get('sales/by-item/export')
  async exportSalesByItem(@Query() query: DateRangeDto, @Res() res: Response) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    const csv = await this.reportsService.exportSalesByItemCSV(from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-by-item-${from.toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }

  @Get('sales/by-category/export')
  async exportSalesByCategory(@Query() query: DateRangeDto, @Res() res: Response) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    const csv = await this.reportsService.exportSalesByCategoryCSV(from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-by-category-${from.toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }

  @Get('sales/by-payment/export')
  async exportSalesByPayment(@Query() query: DateRangeDto, @Res() res: Response) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    const csv = await this.reportsService.exportSalesByPaymentCSV(from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-by-payment-${from.toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }

  @Get('sales/by-cashier/export')
  async exportSalesByCashier(@Query() query: DateRangeDto, @Res() res: Response) {
    const { from, to } = this.reportsService.resolveDateRange(query);
    const csv = await this.reportsService.exportSalesByCashierCSV(from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-by-cashier-${from.toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }
}