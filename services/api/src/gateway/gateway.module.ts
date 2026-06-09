// services/api/src/gateway/gateway.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { OrdersModule } from '../orders/orders.module';
import { AdminGateway } from './admin.gateway';

@Module({
  imports: [forwardRef(() => OrdersModule)],
  providers: [OrdersGateway, AdminGateway],
  exports: [OrdersGateway, AdminGateway],  // ← PENTING: export supaya OrdersService boleh inject
})
export class GatewayModule {}