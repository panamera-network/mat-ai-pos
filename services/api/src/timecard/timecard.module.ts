// src/timecard/timecard.module.ts
import { Module } from '@nestjs/common';
import { TimecardController } from './timecard.controller';
import { TimecardService } from './timecard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [TimecardController],
  providers: [TimecardService],
  exports: [TimecardService],
})
export class TimecardModule {}