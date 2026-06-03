import { Module } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { OrdersService } from '../orders/orders.service';

@Module({
  providers: [OrdersGateway, OrdersService],
  exports: [OrdersGateway],
})
export class GatewayModule {}
