// services/api/src/orders/orders.service.ts
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from '../gateway/orders.gateway';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
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
    private accountingService: AccountingService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const cleanTableId = createOrderDto.tableId?.trim() || undefined;

    const tableId = createOrderDto.type === 'DINE_IN'
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

    // ============================================================
    // CUSTOMER HANDLING
    // ============================================================
    let customerId: string | undefined = undefined;

    if (createOrderDto.customerId) {
      customerId = createOrderDto.customerId;
    } else if (createOrderDto.customerPhone) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { phone: createOrderDto.customerPhone },
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else if (createOrderDto.customerName) {
        const newCustomer = await this.prisma.customer.create({
          data: {
            name: createOrderDto.customerName,
            phone: createOrderDto.customerPhone,
            visits: 0,
            totalSpent: 0,
            lastVisit: new Date(),
          },
        });
        customerId = newCustomer.id;
      }
    }

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
        customerId: customerId,
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
        customer: true,
      },
    });

    // Update customer stats if linked
    if (customerId) {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          visits: { increment: 1 },
          totalSpent: { increment: Number(createOrderDto.totalAmount) },
          lastVisit: new Date(),
        },
      });
    }

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

  async findAll(status?: OrderStatus, outletId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (outletId) where.outletId = outletId;

    return this.prisma.order.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { items: true, table: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true, customer: true },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const cleanTableId = updateOrderDto.tableId?.trim() || undefined;
    const nextTableId = updateOrderDto.type === 'DINE_IN' ? cleanTableId : updateOrderDto.type ? null : undefined;
    const items = updateOrderDto.items?.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      options: item.options || (item as any).modifiers || undefined,
      notes: item.notes || undefined,
    }));

    const order = await this.prisma.order.update({
      where: { id },
      data: {
        type: updateOrderDto.type,
        source: updateOrderDto.source,
        status: updateOrderDto.status,
        totalAmount: updateOrderDto.totalAmount,
        taxAmount: updateOrderDto.taxAmount,
        paidAmount: updateOrderDto.paidAmount,
        paymentMethod: updateOrderDto.paymentMethod,
        customerName: updateOrderDto.customerName,
        customerPhone: updateOrderDto.customerPhone,
        customerAddress: updateOrderDto.customerAddress,
        tableId: nextTableId,
        pax: updateOrderDto.pax,
        reservationTime: updateOrderDto.reservationTime
          ? new Date(updateOrderDto.reservationTime)
          : updateOrderDto.reservationTime === null
            ? null
            : undefined,
        notes: updateOrderDto.notes,
        completedAt: updateOrderDto.status === OrderStatus.PAID ? new Date() : undefined,
        ...(items
          ? {
              items: {
                deleteMany: {},
                create: items,
              },
            }
          : {}),
      },
      include: { items: true, table: true, customer: true },
    });

    if (updateOrderDto.status === OrderStatus.PAID && order.tableId) {
      await this.prisma.diningTable.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    // ============================================================
    // LOYALTY POINTS WHEN ORDER PAID
    // ============================================================
    if (updateOrderDto.status === OrderStatus.PAID && order.customerId) {
      const pointsEarned = Math.floor(Number(order.totalAmount));
      await this.prisma.customer.update({
        where: { id: order.customerId },
        data: {
          points: { increment: pointsEarned },
        },
      });
    }

    // ============================================================
    // AUTO-GENERATE JOURNAL ENTRY WHEN ORDER PAID
    // ============================================================
    if (updateOrderDto.status === OrderStatus.PAID) {
      try {
        const journalEntry = await this.accountingService.createOrderJournal(order.id);
        console.log(`✅ Auto-journal created for order ${order.orderNumber}: ${journalEntry.reference}`);
      } catch (error) {
        console.error(`⚠️ Failed to create journal for order ${order.orderNumber}:`, error.message);
      }
    }

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
        customer: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
