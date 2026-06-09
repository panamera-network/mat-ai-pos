// services/api/src/orders/orders.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { InventoryModule } from '../inventory/inventory.module';  // ← ADD

@Module({
  imports: [
    forwardRef(() => GatewayModule),
    forwardRef(() => InventoryModule),  // ← ADD
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}