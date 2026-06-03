// src/orders/orders.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, ItemStatus, OrderSource, OrderType } from '../common/enums';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private getPrisma() {
    return this.prisma as any;
  }

  async create(dto: CreateOrderDto) {
    const order = await this.getPrisma().order.create({
      data: {
        totalAmount: dto.totalAmount,
        source: dto.source || OrderSource.QR_MENU,
        type: dto.type || OrderType.DINE_IN,
        tableId: dto.tableId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerAddress: dto.customerAddress,
        pax: dto.pax,
        reservationTime: dto.reservationTime ? new Date(dto.reservationTime) : undefined,
        notes: dto.notes,
        items: {
          create: dto.items.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            options: item.options || undefined,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    return order;
  }

  async findAll(status?: OrderStatus) {
    return this.getPrisma().order.findMany({
      where: status ? { status } : undefined,
      include: {
        items: true,
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.getPrisma().order.findUnique({
      where: { id },
      include: {
        items: true,
        table: true,
      },
    });

    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.getPrisma().order.update({
      where: { id },
      data: {
        ...dto,
        completedAt: dto.status === OrderStatus.SERVED ? new Date() : undefined,
      },
      include: {
        items: true,
        table: true,
      },
    });

    return order;
  }

  async updateItemStatus(itemId: string, status: ItemStatus) {
    const item = await this.getPrisma().orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    const orderItems = await this.getPrisma().orderItem.findMany({
      where: { orderId: item.orderId },
    });

    const allReady = orderItems.every((i: any) => i.status === ItemStatus.READY);
    if (allReady) {
      await this.getPrisma().order.update({
        where: { id: item.orderId },
        data: { status: OrderStatus.READY },
      });
    }

    return item;
  }

  async getKitchenQueue() {
    return this.getPrisma().order.findMany({
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