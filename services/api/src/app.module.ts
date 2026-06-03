//sservices/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { OrdersModule } from './orders/orders.module';
import { GatewayModule } from './gateway/gateway.module';
import { MenuItemsController } from './menu-items/menu-items.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OrdersModule,
    GatewayModule,
  ],
  controllers: [MenuItemsController],
})
export class AppModule {}
