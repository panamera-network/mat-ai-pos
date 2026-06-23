import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

@Injectable()
export class OutletService {
  constructor(
    private prisma: PrismaService,
    private accountingService: AccountingService,
  ) {}

  async create(dto: CreateOutletDto) {
    const outlet = await this.prisma.outlet.create({ data: dto });

    // Auto-generate preset COA for new outlet
    try {
      await this.accountingService.createPresetCoa(outlet.id);
      console.log(`✅ Preset COA created for outlet: ${outlet.name}`);
    } catch (error) {
      console.error(`⚠️ Failed to create preset COA for ${outlet.name}:`, error.message);
    }

    return outlet;
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
        accounts: { orderBy: { code: 'asc' } },
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
