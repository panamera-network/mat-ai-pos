// services/api/src/inventory/inventory.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CostingModule } from '../costing/costing.module';  // <-- ADD

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => CostingModule),  // <-- ADD (forwardRef kalau circular dependency)
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}