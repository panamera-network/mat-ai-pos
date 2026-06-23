import { Module } from '@nestjs/common';
import { OutletService } from './outlet.service';
import { OutletController } from './outlet.controller';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [AccountingModule],
  controllers: [OutletController],
  providers: [OutletService],
  exports: [OutletService],
})
export class OutletModule {}
