import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}

  @Get('options')
  getOptions() {
    return this.service.getRedeemOptions();
  }

  @Post('redeem/:customerId')
  redeem(
    @Param('customerId') customerId: string,
    @Body() body: { points: number; reward: string; orderId?: string },
  ) {
    return this.service.redeemPoints(customerId, body.points, body.reward, body.orderId);
  }
}
