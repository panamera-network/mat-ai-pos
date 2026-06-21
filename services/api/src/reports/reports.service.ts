import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SalesSummary {
  period: { from: Date; to: Date };
  summary: {
    totalSales: number;
    totalTax: number;
    orderCount: number;
    averageOrder: number;
  };
  orders: Awaited<ReturnType<PrismaService['order']['findMany']>>;
}

export interface ItemSales {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CategorySales {
  category: string;
  quantity: number;
  revenue: number;
}

export interface PaymentSales {
  method: string;
  count: number;
  total: number;
}

export interface CashierSales {
  cashier: string;
  count: number;
  total: number;
}

export interface OrderTypeSales {
  type: string;
  count: number;
  total: number;
}

export interface HourlyBreakdown {
  hour: number;
  count: number;
  total: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // DATE RANGE HELPER — Default 1 bulan
  // ==========================================

  resolveDateRange(query: { from?: string; to?: string }): { from: Date; to: Date } {
    const now = new Date();
    const to = query.to ? new Date(query.to) : new Date(now);
    to.setHours(23, 59, 59, 999);

    const from = query.from ? new Date(query.from) : new Date(now);
    if (!query.from) {
      // Default 1 bulan lepas
      from.setMonth(from.getMonth() - 1);
    }
    from.setHours(0, 0, 0, 0);

    return { from, to };
  }

  // ==========================================
  // REPORT QUERIES
  // ==========================================

  async salesSummary(from: Date, to: Date): Promise<SalesSummary> {
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

  async salesByItem(from: Date, to: Date): Promise<ItemSales[]> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: from, lte: to }, status: { in: ['PAID', 'SERVED'] } },
      },
      include: { menuItem: true },
    });

    const grouped: { [key: string]: ItemSales } = {};
    for (const item of items) {
      const name = item.name;
      if (!grouped[name]) grouped[name] = { name, quantity: 0, revenue: 0 };
      grouped[name].quantity += item.quantity;
      grouped[name].revenue += Number(item.totalPrice);
    }

    return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
  }

  async salesByCategory(from: Date, to: Date): Promise<CategorySales[]> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: from, lte: to }, status: { in: ['PAID', 'SERVED'] } },
      },
      include: { menuItem: { include: { category: true } } },
    });

    const grouped: { [key: string]: CategorySales } = {};
    for (const item of items) {
      const catName = item.menuItem?.category?.name || 'Uncategorized';
      if (!grouped[catName]) grouped[catName] = { category: catName, quantity: 0, revenue: 0 };
      grouped[catName].quantity += item.quantity;
      grouped[catName].revenue += Number(item.totalPrice);
    }

    return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
  }

  async salesByPayment(from: Date, to: Date): Promise<PaymentSales[]> {
    const receipts = await this.prisma.receipt.findMany({
      where: { createdAt: { gte: from, lte: to } },
    });

    const grouped: { [key: string]: PaymentSales } = {};
    for (const r of receipts) {
      const method = r.paymentMethod;
      if (!grouped[method]) grouped[method] = { method, count: 0, total: 0 };
      grouped[method].count += 1;
      grouped[method].total += Number(r.totalAmount);
    }

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }

  async salesByCashier(from: Date, to: Date): Promise<CashierSales[]> {
    const receipts = await this.prisma.receipt.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { cashier: { select: { name: true } } },
    });

    const grouped: { [key: string]: CashierSales } = {};
    for (const r of receipts) {
      const name = r.cashier?.name || 'Unknown';
      if (!grouped[name]) grouped[name] = { cashier: name, count: 0, total: 0 };
      grouped[name].count += 1;
      grouped[name].total += Number(r.totalAmount);
    }

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }

  async salesByOrderType(from: Date, to: Date): Promise<OrderTypeSales[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ['PAID', 'SERVED'] },
      },
    });

    const grouped: { [key: string]: OrderTypeSales } = {};
    for (const o of orders) {
      const type = o.type;
      if (!grouped[type]) grouped[type] = { type, count: 0, total: 0 };
      grouped[type].count += 1;
      grouped[type].total += Number(o.totalAmount);
    }

    return Object.values(grouped).sort((a, b) => b.total - a.total);
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

  async dailyReport(date: Date): Promise<SalesSummary> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.salesSummary(start, end);
  }

  async hourlyBreakdown(from: Date, to: Date): Promise<HourlyBreakdown[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ['PAID', 'SERVED'] },
      },
    });

    const hourly: HourlyBreakdown[] = Array.from({ length: 24 }, (_, i) => ({
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

  // ==========================================
  // CSV EXPORT HELPERS
  // ==========================================

  private toCSV(headers: string[], rows: (string | number)[][]): string {
    const escape = (val: string | number) => {
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const lines = [headers.join(','), ...rows.map(r => r.map(escape).join(','))];
    return lines.join('\n');
  }

  // ==========================================
  // CSV EXPORTS
  // ==========================================

  async exportSalesCSV(from: Date, to: Date): Promise<string> {
    const report = await this.salesSummary(from, to);
    const headers = ['Order ID', 'Order Number', 'Status', 'Type', 'Total', 'Tax', 'Created At'];
    const rows = report.orders.map(o => [
      o.id,
      o.orderNumber,
      o.status,
      o.type,
      Number(o.totalAmount).toFixed(2),
      Number(o.taxAmount || 0).toFixed(2),
      o.createdAt.toISOString(),
    ]);
    return this.toCSV(headers, rows);
  }

  async exportSalesByItemCSV(from: Date, to: Date): Promise<string> {
    const items = await this.salesByItem(from, to);
    const headers = ['Item Name', 'Quantity Sold', 'Revenue'];
    const rows = items.map(i => [i.name, i.quantity, i.revenue.toFixed(2)]);
    return this.toCSV(headers, rows);
  }

  async exportSalesByCategoryCSV(from: Date, to: Date): Promise<string> {
    const cats = await this.salesByCategory(from, to);
    const headers = ['Category', 'Quantity Sold', 'Revenue'];
    const rows = cats.map(c => [c.category, c.quantity, c.revenue.toFixed(2)]);
    return this.toCSV(headers, rows);
  }

  async exportSalesByPaymentCSV(from: Date, to: Date): Promise<string> {
    const payments = await this.salesByPayment(from, to);
    const headers = ['Payment Method', 'Transaction Count', 'Total'];
    const rows = payments.map(p => [p.method, p.count, p.total.toFixed(2)]);
    return this.toCSV(headers, rows);
  }

  async exportSalesByCashierCSV(from: Date, to: Date): Promise<string> {
    const cashiers = await this.salesByCashier(from, to);
    const headers = ['Cashier', 'Transaction Count', 'Total'];
    const rows = cashiers.map(c => [c.cashier, c.count, c.total.toFixed(2)]);
    return this.toCSV(headers, rows);
  }
}