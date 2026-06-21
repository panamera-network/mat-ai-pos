// src/modifier/modifier.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';

@Injectable()
export class ModifierService {
  constructor(private prisma: PrismaService) {}

  async findAll(outletId?: string) {
    return this.prisma.modifier.findMany({
      where: outletId ? { outletId } : {},
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const modifier = await this.prisma.modifier.findUnique({ where: { id } });
    if (!modifier) throw new NotFoundException('Modifier not found');
    return modifier;
  }

  async create(dto: CreateModifierDto) {
    return this.prisma.modifier.create({
      data: {
        name: dto.name,
        price: dto.price,
        categoryId: dto.categoryId,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        outletId: dto.outletId,
      },
    });
  }

  async update(id: string, dto: UpdateModifierDto) {
    await this.findOne(id);
    return this.prisma.modifier.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.modifier.delete({ where: { id } });
  }
}