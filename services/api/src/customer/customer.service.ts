import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      return this.prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          visits: { increment: 1 },
          lastVisit: new Date(),
        },
      });
    }

    return this.prisma.customer.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        visits: 1,
        lastVisit: new Date(),
      },
    });
  }

  async findAll(outletId?: string) {
    return this.prisma.customer.findMany({
      where: outletId ? { orders: { some: { outletId } } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
        redemptions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async findByPhone(phone: string) {
    return this.prisma.customer.findUnique({
      where: { phone },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async addPoints(id: string, points: number, amount: number) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        points: { increment: points },
        totalSpent: { increment: amount },
        lastVisit: new Date(),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.customer.delete({ where: { id } });
  }
}
