// src/discount/discount.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountService {
  constructor(private prisma: PrismaService) {}

  async findAll(outletId?: string) {
    return this.prisma.discount.findMany({
      where: outletId ? { outletId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(outletId?: string) {
    const now = new Date();
    return this.prisma.discount.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        ...(outletId && { outletId }),
      },
    });
  }

  async findOne(id: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  async create(dto: CreateDiscountDto) {
    return this.prisma.discount.create({
      data: {
        name: dto.name,
        type: dto.type,
        value: dto.value,
        minSpend: dto.minSpend,
        maxDiscount: dto.maxDiscount,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
        outletId: dto.outletId,
        applicableItems: dto.applicableItems,
        applicableCategories: dto.applicableCategories,
      },
    });
  }

  async update(id: string, dto: UpdateDiscountDto) {
    await this.findOne(id);
    return this.prisma.discount.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.minSpend !== undefined && { minSpend: dto.minSpend }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.applicableItems && { applicableItems: dto.applicableItems }),
        ...(dto.applicableCategories && { applicableCategories: dto.applicableCategories }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.discount.delete({ where: { id } });
  }
}