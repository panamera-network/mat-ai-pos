// src/receipts/receipts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReceiptsService {
  constructor(private prisma: PrismaService) {}

  async findAll(options?: { from?: Date; to?: Date; cashierId?: string }) {
    const where: any = {};
    
    if (options?.from || options?.to) {
      where.createdAt = {};
      if (options.from) where.createdAt.gte = options.from;
      if (options.to) where.createdAt.lte = options.to;
    }
    
    if (options?.cashierId) where.cashierId = options.cashierId;

    return this.prisma.receipt.findMany({
      where,
      include: { order: true, cashier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: { order: true, cashier: true },
    });
    if (!receipt) throw new NotFoundException(`Receipt ${id} not found`);
    return receipt;
  }

  async create(data: {
    orderId: string;
    totalAmount: number;
    paidAmount: number;
    change?: number;
    paymentMethod: string;
    taxAmount?: number;
    cashierId: string;
    posId: string;
    itemsSnapshot: any;
    customerInfo?: any;
  }) {
    const receiptNo = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return this.prisma.receipt.create({
      data: {
        receiptNo,
        ...data,
      },
    });
  }

  async trackPrint(id: string) {
    return this.prisma.receipt.update({
      where: { id },
      data: {
        printCount: { increment: 1 },
        lastPrintedAt: new Date(),
      },
    });
  }

  async generatePdf(id: string, pdfUrl: string) {
    return this.prisma.receipt.update({
      where: { id },
      data: { pdfUrl, pdfGeneratedAt: new Date() },
    });
  }

  async emailReceipt(id: string, email: string) {
    return this.prisma.receipt.update({
      where: { id },
      data: { emailedTo: email, emailSentAt: new Date() },
    });
  }
}