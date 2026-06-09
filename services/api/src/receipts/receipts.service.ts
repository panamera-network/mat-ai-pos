// src/receipts/receipts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class ReceiptsService {
  constructor(private prisma: PrismaService) {}

  async findAll(options?: { from?: Date; to?: Date; cashierId?: string }) {
    const where: Record<string, unknown> = {};

    if (options?.from || options?.to) {
      where.createdAt = {};
      if (options.from) (where.createdAt as Record<string, Date>).gte = options.from;
      if (options.to) (where.createdAt as Record<string, Date>).lte = options.to;
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
    paymentMethod: PaymentMethod;
    taxAmount?: number;
    cashierId: string;
    posId: string;
    itemsSnapshot: unknown;
    customerInfo?: unknown;
  }) {
    const receiptNo = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    // Use unchecked create — flat fields, no relation objects
    const createData: Prisma.ReceiptUncheckedCreateInput = {
      receiptNo,
      orderId: data.orderId,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      change: data.change,
      paymentMethod: data.paymentMethod,
      taxAmount: data.taxAmount,
      cashierId: data.cashierId,
      posId: data.posId,
      itemsSnapshot: data.itemsSnapshot as Prisma.InputJsonValue,
      customerInfo: data.customerInfo as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.receipt.create({
      data: createData,
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