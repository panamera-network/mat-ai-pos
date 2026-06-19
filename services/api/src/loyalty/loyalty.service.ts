import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoyaltyService {
  // 1 point per RM 1 spent
  private readonly POINTS_RATE = 1;

  constructor(private prisma: PrismaService) {}

  calculatePoints(amount: number): number {
    return Math.floor(amount * this.POINTS_RATE);
  }

  async addPointsFromOrder(customerId: string, orderTotal: number) {
    const points = this.calculatePoints(orderTotal);

    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        points: { increment: points },
        totalSpent: { increment: orderTotal },
        lastVisit: new Date(),
      },
    });
  }

  async redeemPoints(customerId: string, pointsToUse: number, reward: string, orderId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.points < pointsToUse) {
      throw new Error('Insufficient points');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id: customerId },
        data: { points: { decrement: pointsToUse } },
      }),
      this.prisma.redemption.create({
        data: {
          customerId,
          pointsUsed: pointsToUse,
          reward,
          orderId,
        },
      }),
    ]);

    return updated;
  }

  getRedeemOptions(): { points: number; value: number; label: string }[] {
    return [
      { points: 100, value: 5, label: 'RM 5 off' },
      { points: 200, value: 12, label: 'RM 12 off' },
      { points: 500, value: 35, label: 'RM 35 off' },
    ];
  }
}
