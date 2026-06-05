// src/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.setting.findMany();
  }

  async findOne(key: string) {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  async upsert(key: string, value: string, description?: string, updatedBy?: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value, description, updatedBy, updatedAt: new Date() },
      create: { key, value, description, updatedBy },
    });
  }

  async getValue(key: string, defaultValue?: string): Promise<string | undefined> {
    const setting = await this.findOne(key);
    return setting?.value || defaultValue;
  }

  async getNumericValue(key: string, defaultValue: number = 0): Promise<number> {
    const value = await this.getValue(key);
    return value ? parseFloat(value) : defaultValue;
  }

  async delete(key: string) {
    return this.prisma.setting.delete({ where: { key } });
  }
}