// src/receipts/receipts.controller.ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { PaymentMethod } from '@prisma/client';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('cashierId') cashierId?: string,
  ) {
    return this.receiptsService.findAll({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      cashierId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receiptsService.findOne(id);
  }

  @Post()
  create(@Body() dto: {
    orderId: string;
    totalAmount: number;
    paidAmount: number;
    change?: number;
    paymentMethod: PaymentMethod;
    taxAmount?: number;
    cashierId: string;
    posId: string;
    itemsSnapshot: any;
    customerInfo?: any;
  }) {
    return this.receiptsService.create(dto);
  }

  @Post(':id/print')
  trackPrint(@Param('id') id: string) {
    return this.receiptsService.trackPrint(id);
  }

  @Post(':id/pdf')
  generatePdf(@Param('id') id: string, @Body('pdfUrl') pdfUrl: string) {
    return this.receiptsService.generatePdf(id, pdfUrl);
  }

  @Post(':id/email')
  emailReceipt(@Param('id') id: string, @Body('email') email: string) {
    return this.receiptsService.emailReceipt(id, email);
  }
}