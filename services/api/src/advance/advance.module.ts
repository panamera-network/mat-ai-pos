// src/advance/advance.module.ts
import { Module } from '@nestjs/common';
import { AdvanceController } from './advance.controller';
import { AdvanceService } from './advance.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdvanceController],
  providers: [AdvanceService],
  exports: [AdvanceService],
})
export class AdvanceModule {}