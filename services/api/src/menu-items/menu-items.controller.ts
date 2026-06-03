// src/menu-items/menu-items.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('menu-items')
export class MenuItemsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: { category: 'asc' },
    });
  }
}