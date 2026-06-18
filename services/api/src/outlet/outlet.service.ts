import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

@Injectable()
export class OutletService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOutletDto) {
    return this.prisma.outlet.create({ data: dto });
  }

  async findAll() {
    return this.prisma.outlet.findMany({
      include: {
        _count: {
          select: { staff: true, orders: true },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.outlet.findUnique({
      where: { id },
      include: {
        staff: true,
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
        inventoryItems: true,
      },
    });
  }

  async update(id: string, dto: UpdateOutletDto) {
    return this.prisma.outlet.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.outlet.delete({ where: { id } });
  }
}