import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StaffModule } from '../staff/staff.module';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    StaffModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mat-ai-secret-key',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService, JwtModule],  // <-- ADD JwtModule
})
export class AuthModule {}