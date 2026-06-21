// src/modifier/modifier.module.ts
import { Module } from '@nestjs/common';
import { ModifierService } from './modifier.service';
import { ModifierController } from './modifier.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ModifierController],
  providers: [ModifierService],
  exports: [ModifierService],
})
export class ModifierModule {}