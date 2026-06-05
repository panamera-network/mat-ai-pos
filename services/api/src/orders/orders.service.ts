// src/orders/orders.service.ts
import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from '../gateway/orders.gateway';
import { OrderStatus, ItemStatus, OrderSource, OrderType, TableStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => OrdersGateway))
    private gateway: OrdersGateway,
  ) {}

  async create(data: {
    totalAmount: number;
    source?: OrderSource;
    type?: OrderType;
    tableId?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    pax?: number;
    reservationTime?: string;
    notes?: string;
    items: {
      menuItemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      options?: any;
      notes?: string;
    }[];
  }) {
    const order = await this.prisma.order.create({
      data: {
        orderNumber: `ORD-${Math.random().toString(36).substring(2, 10)}`,
        totalAmount: data.totalAmount,
        source: data.source || OrderSource.POS,
        type: data.type || OrderType.DINE_IN,
        tableId: data.tableId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        pax: data.pax,
        reservationTime: data.reservationTime ? new Date(data.reservationTime) : undefined,
        notes: data.notes,
        items: {
          create: data.items,
        },
      },
      include: { items: true, table: true },
    });

    // Update table status if dine-in
    if (data.tableId && data.type === OrderType.DINE_IN) {
      await this.prisma.table.update({
        where: { id: data.tableId },
        data: { status: TableStatus.OCCUPIED },
      });
    }

    // Broadcast to POS and KDS
    this.gateway.broadcastNewOrder(order);

    return order;
  }

  async updateItemStatus(itemId: string, status: ItemStatus) {
    const item = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });

    const allReady = orderItems.every((i) => i.status === ItemStatus.READY);
    
    if (allReady) {
      const updatedOrder = await this.prisma.order.update({
        where: { id: item.orderId },
        data: { status: OrderStatus.READY },
        include: { items: true, table: true },
      });
      this.gateway.broadcastOrderReady(updatedOrder);
    }

    return item;
  }

  async findAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: { items: true, table: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async update(id: string, data: Partial<{
    status: OrderStatus;
    paidAmount: number;
    paymentMethod: string;
    notes: string;
  }>) {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        ...data,
        completedAt: data.status === OrderStatus.SERVED ? new Date() : undefined,
      },
      include: { items: true, table: true },
    });

    // Free table if served
    if (data.status === OrderStatus.SERVED && order.tableId) {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: TableStatus.AVAILABLE },
      });
    }

    return order;
  }

  async getKitchenQueue() {
    return this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY] },
      },
      include: {
        items: {
          where: {
            status: { in: [ItemStatus.PENDING, ItemStatus.PREPARING] },
          },
        },
        table: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}