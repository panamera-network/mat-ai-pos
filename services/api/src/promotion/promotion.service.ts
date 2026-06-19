import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePromotionDto) {
    return this.prisma.promotion.create({ data: dto as any });
  }

  async findAll(outletId?: string, active?: boolean) {
    return this.prisma.promotion.findMany({
      where: {
        ...(outletId && { outletId }),
        ...(active !== undefined && { isActive: active }),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findActive(outletId: string, customerType: string = 'ALL') {
    const now = new Date();

    return this.prisma.promotion.findMany({
      where: {
        outletId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          { target: 'ALL' },
          { target: customerType as any },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    return promo;
  }

  async update(id: string, dto: UpdatePromotionDto) {
    return this.prisma.promotion.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    return this.prisma.promotion.delete({ where: { id } });
  }
}
