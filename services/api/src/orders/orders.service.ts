// services/api/src/orders/orders.service.ts
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from '../gateway/orders.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, ItemStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => OrdersGateway))
    private ordersGateway: OrdersGateway,
    @Inject(forwardRef(() => InventoryService))
    private inventoryService: InventoryService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const cleanTableId = createOrderDto.tableId?.trim() || undefined;

    const tableId = ['DINE_IN', 'RESERVATION'].includes(createOrderDto.type) 
      ? cleanTableId 
      : undefined;

    const items = (createOrderDto.items || []).map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      options: item.options || (item as any).modifiers || undefined,
      notes: item.notes || undefined,
    }));

    const orderNumber = createOrderDto.orderNumber || `ORD-${Date.now()}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        type: createOrderDto.type,
        source: createOrderDto.source || 'POS',
        status: 'PENDING',
        totalAmount: createOrderDto.totalAmount,
        taxAmount: createOrderDto.taxAmount,
        customerName: createOrderDto.customerName || undefined,
        customerPhone: createOrderDto.customerPhone || undefined,
        customerAddress: createOrderDto.customerAddress || undefined,
        tableId,
        pax: createOrderDto.pax || undefined,
        reservationTime: createOrderDto.reservationTime 
          ? new Date(createOrderDto.reservationTime) 
          : undefined,
        notes: createOrderDto.notes || undefined,
        outletId: createOrderDto.outletId || undefined,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    try {
      for (const item of order.items) {
        await this.inventoryService.autoDeductInventory(
          item.menuItemId, 
          item.quantity, 
          order.id
        );
        await this.inventoryService.checkAndDisableMenuItem(item.menuItemId);
      }
    } catch (err) {
      console.error('Auto deduct failed:', err);
    }

    this.ordersGateway.broadcastNewOrder(order);

    return order;
  }

  async findAll(status?: OrderStatus, outletId?: string) {  // ← TAMBAH outletId
    const where: any = {};
    if (status) where.status = status;
    if (outletId) where.outletId = outletId;  // ← TAMBAH

    return this.prisma.order.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { items: true, table: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderDto.status,
        paidAmount: updateOrderDto.paidAmount,
        paymentMethod: updateOrderDto.paymentMethod,
        completedAt: updateOrderDto.status === OrderStatus.PAID ? new Date() : undefined,
      },
      include: { items: true, table: true },
    });

    this.ordersGateway.broadcastOrderUpdated(order);
    if (updateOrderDto.status === OrderStatus.PAID) {
      this.ordersGateway.server.to('kds').emit('kds:orderPaid', order);
    }
    if (updateOrderDto.status === OrderStatus.READY) {
      this.ordersGateway.server.to('pos').emit('pos:orderReady', order);
      this.ordersGateway.server.to('qr').emit('qr:orderReady', order);
    }

    return order;
  }

  async updateItemStatus(itemId: string, status: ItemStatus) {
    const item = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    const order = await this.findOne(item.orderId);

    this.ordersGateway.server.to('all').emit('order:updated', order);
    this.ordersGateway.server.to('kds').emit('kds:itemUpdated', { item, order });

    return item;
  }

  async getKitchenQueue() {
    return this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.PREPARING] },
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