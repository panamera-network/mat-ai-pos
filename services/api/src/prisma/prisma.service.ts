// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient 
implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  

  private serialize(data: unknown): unknown {
    if (data === null || data === undefined) return data;

    // Array
    if (Array.isArray(data)) {
      return data.map(item => this.serialize(item));
    }

    // Object
    if (typeof data === 'object' && data !== null) {
      const serialized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        // Prisma Decimal → number
        if (value && typeof value === 'object' && 'toNumber' in value) {
          serialized[key] = (value as { toNumber: () => number }).toNumber();
        }
        // Date → ISO string
        else if (value instanceof Date) {
          serialized[key] = value.toISOString();
        }
        // Nested object/array → recurse
        else if (typeof value === 'object' && value !== null) {
          serialized[key] = this.serialize(value);
        }
        // Primitive → pass through
        else {
          serialized[key] = value;
        }
      }

      return serialized;
    }

    return data;
  }
}