// src/categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { 
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            isAvailable: true,
            stock: true,
            minStock: true,
            options: true,
            // ❌ Exclude: ingredients, stockLogs, orderItems
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: { 
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            isAvailable: true,
            stock: true,
            minStock: true,
            options: true,
            ingredients: {
              include: {
                inventoryItem: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  create(data: { name: string; icon?: string; sortOrder?: number }) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Partial<{ name: string; icon: string; sortOrder: number; isActive: boolean }>) {
    return this.prisma.category.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}