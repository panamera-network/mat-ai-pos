import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LandingPageService } from './landing-page.service';
import { LandingPageController } from './landing-page.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [LandingPageController],
  providers: [LandingPageService],
  exports: [LandingPageService],
})
export class LandingPageModule {}