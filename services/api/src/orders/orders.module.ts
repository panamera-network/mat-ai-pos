// services/api/src/orders/orders.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    forwardRef(() => GatewayModule),
    forwardRef(() => InventoryModule),
    forwardRef(() => AccountingModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
