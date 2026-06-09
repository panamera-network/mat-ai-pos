// services/api/src/orders/orders.service.ts
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from '../gateway/orders.gateway';
import { InventoryService } from '../inventory/inventory.service';  // ← ADD
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, ItemStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => OrdersGateway))
    private ordersGateway: OrdersGateway,
    @Inject(forwardRef(() => InventoryService))  // ← ADD
    private inventoryService: InventoryService,  // ← ADD
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    // Clean empty strings → undefined
    const cleanTableId = createOrderDto.tableId?.trim() || undefined;
    
    // Only allow tableId for dine-in and reservation
    const tableId = ['DINE_IN', 'RESERVATION'].includes(createOrderDto.type) 
      ? cleanTableId 
      : undefined;

    // Clean items — map legacy modifiers to options
    const items = (createOrderDto.items || []).map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      options: item.options || (item as any).modifiers || undefined,
      notes: item.notes || undefined,
    }));

    // Generate orderNumber if not provided
    const orderNumber = createOrderDto.orderNumber || `ORD-${Date.now()}`;

    // Create order (WITHOUT try-catch inside)
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
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    // Auto deduct inventory (AFTER order created, OUTSIDE prisma call)
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
      // Don't fail order, just log
    }

    // Broadcast via Socket.IO
    this.ordersGateway.broadcastNewOrder(order);

    return order;
  }

  async findAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
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

    // Broadcast
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