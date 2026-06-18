// src/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(outletId?: string) {  // ← TAMBAH parameter
    const where: any = {};
    if (outletId) where.outletId = outletId;  // ← TAMBAH

    return this.prisma.setting.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  async findOne(key: string, outletId?: string) {  // ← TAMBAH outletId
    return this.prisma.setting.findUnique({ 
      where: { 
        key_outletId: { key, outletId: outletId || '' }  // ← Composite key
      } 
    });
  }

  async upsert(key: string, value: string, description?: string, updatedBy?: string, outletId?: string) {  // ← TAMBAH outletId
    return this.prisma.setting.upsert({
      where: { 
        key_outletId: { key, outletId: outletId || '' }  // ← Composite key
      },
      update: { value, description, updatedBy, updatedAt: new Date(), outletId: outletId || '' },
      create: { key, value, description, updatedBy, outletId: outletId || '' },
    });
  }

  async getValue(key: string, defaultValue?: string, outletId?: string): Promise<string | undefined> {  // ← TAMBAH outletId
    const setting = await this.findOne(key, outletId);
    return setting?.value || defaultValue;
  }

  async getNumericValue(key: string, defaultValue: number = 0, outletId?: string): Promise<number> {  // ← TAMBAH outletId
    const value = await this.getValue(key, undefined, outletId);
    return value ? parseFloat(value) : defaultValue;
  }

  async delete(key: string, outletId?: string) {  // ← TAMBAH outletId
    return this.prisma.setting.delete({ 
      where: { 
        key_outletId: { key, outletId: outletId || '' } 
      } 
    });
  }
}