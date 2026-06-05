// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async salesSummary(from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ['PAID', 'SERVED'] },
      },
      include: { items: true, receipt: true },
    });

    const totalSales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalTax = orders.reduce((sum, o) => sum + Number(o.taxAmount || 0), 0);
    const orderCount = orders.length;
    const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;

    return {
      period: { from, to },
      summary: { totalSales, totalTax, orderCount, averageOrder },
      orders,
    };
  }

  async salesByItem(from: Date, to: Date) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: from, lte: to }, status: { in: ['PAID', 'SERVED'] } },
      },
      include: { menuItem: true },
    });

    const grouped = items.reduce((acc, item) => {
      const name = item.name;
      if (!acc[name]) acc[name] = { name, quantity: 0, revenue: 0 };
      acc[name].quantity += item.quantity;
      acc[name].revenue += Number(item.totalPrice);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => b.revenue - a.revenue);
  }

  async salesByCategory(from: Date, to: Date) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: from, lte: to }, status: { in: ['PAID', 'SERVED'] } },
      },
      include: { menuItem: { include: { category: true } } },
    });

    const grouped = items.reduce((acc, item) => {
      const catName = item.menuItem?.category?.name || 'Uncategorized';
      if (!acc[catName]) acc[catName] = { category: catName, quantity: 0, revenue: 0 };
      acc[catName].quantity += item.quantity;
      acc[catName].revenue += Number(item.totalPrice);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => b.revenue - a.revenue);
  }

  async salesByPayment(from: Date, to: Date) {
    const receipts = await this.prisma.receipt.findMany({
      where: { createdAt: { gte: from, lte: to } },
    });

    const grouped = receipts.reduce((acc, r) => {
      const method = r.paymentMethod;
      if (!acc[method]) acc[method] = { method, count: 0, total: 0 };
      acc[method].count += 1;
      acc[method].total += Number(r.totalAmount);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => b.total - a.total);
  }

  async salesByCashier(from: Date, to: Date) {
    const receipts = await this.prisma.receipt.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { cashier: { select: { name: true } } },
    });

    const grouped = receipts.reduce((acc, r) => {
      const name = r.cashier?.name || 'Unknown';
      if (!acc[name]) acc[name] = { cashier: name, count: 0, total: 0 };
      acc[name].count += 1;
      acc[name].total += Number(r.totalAmount);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => b.total - a.total);
  }

  async salesByOrderType(from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ['PAID', 'SERVED'] },
      },
    });

    const grouped = orders.reduce((acc, o) => {
      const type = o.type;
      if (!acc[type]) acc[type] = { type, count: 0, total: 0 };
      acc[type].count += 1;
      acc[type].total += Number(o.totalAmount);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => b.total - a.total);
  }

  async popularItems(from: Date, to: Date, limit: number = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['menuItemId', 'name'],
      where: {
        order: { createdAt: { gte: from, lte: to }, status: { in: ['PAID', 'SERVED'] } },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return items.map(i => ({
      name: i.name,
      quantity: i._sum.quantity,
      revenue: i._sum.totalPrice,
    }));
  }

  async dailyReport(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.salesSummary(start, end);
  }

  async hourlyBreakdown(from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ['PAID', 'SERVED'] },
      },
    });

    const hourly = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      total: 0,
    }));

    orders.forEach(o => {
      const hour = o.createdAt.getHours();
      hourly[hour].count += 1;
      hourly[hour].total += Number(o.totalAmount);
    });

    return hourly;
  }
}