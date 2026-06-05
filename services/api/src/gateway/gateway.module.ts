// src/gateway/gateway.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [forwardRef(() => OrdersModule)],
  providers: [OrdersGateway],
  exports: [OrdersGateway],
})
export class GatewayModule {}