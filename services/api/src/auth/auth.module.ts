// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StaffModule } from '../staff/staff.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    StaffModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mat-ai-secret-key',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}