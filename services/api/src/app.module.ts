// src/app.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { AuthModule } from './auth/auth.module';
import { StaffModule } from './staff/staff.module';
import { CategoriesModule } from './categories/categories.module';
import { MenuItemsModule } from './menu-items/menu-items.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { InventoryModule } from './inventory/inventory.module';
import { TimecardModule } from './timecard/timecard.module';
import { LeaveModule } from './leave/leave.module';
import { AdvanceModule } from './advance/advance.module';
import { PayrollModule } from './payroll/payroll.module';
import { ReportsModule } from './reports/reports.module';
import { GatewayModule } from './gateway/gateway.module';
import { OutletModule } from './outlet/outlet.module';
import { CostingModule } from './costing/costing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SettingsModule,
    AuthModule,
    StaffModule,
    CategoriesModule,
    MenuItemsModule,
    TablesModule,
    OrdersModule,
    ReceiptsModule,
    InventoryModule,
    TimecardModule,
    LeaveModule,
    AdvanceModule,
    PayrollModule,
    ReportsModule,
    GatewayModule,
    OutletModule,
    CostingModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SerializeInterceptor,
    },
  ],
})
export class AppModule {}