import {Injectable, BadRequestException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {Decimal} from '@prisma/client/runtime/library';

const DEFAULT_DAILY_LIMIT = 5000;
const DEFAULT_MONTHLY_LIMIT = 20000;

@Injectable()
export class LimitsService {
  constructor(private prisma: PrismaService) {}

  private getPeriodKeys(): {daily: string; monthly: string} {
    const now = new Date();
    const daily = now.toISOString().slice(0, 10);
    const monthly = now.toISOString().slice(0, 7);
    return {daily, monthly};
  }

  private async getTierLimits(userId: string): Promise<{
    daily: number;
    monthly: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      include: {limitTier: true},
    });
    const tier = user?.limitTier;
    return {
      daily: tier
        ? Number(tier.dailyLimitUsdt)
        : DEFAULT_DAILY_LIMIT,
      monthly: tier
        ? Number(tier.monthlyLimitUsdt)
        : DEFAULT_MONTHLY_LIMIT,
    };
  }

  private async getUsage(
    userId: string,
    periodType: string,
    periodKey: string,
  ): Promise<number> {
    const record = await this.prisma.limitUsage.findUnique({
      where: {
        userId_periodType_periodKey: {userId, periodType, periodKey},
      },
    });
    return record ? Number(record.amountUsdt) : 0;
  }

  async getRemaining(userId: string): Promise<{
    dailyLimit: number;
    dailyUsed: number;
    dailyRemaining: number;
    monthlyLimit: number;
    monthlyUsed: number;
    monthlyRemaining: number;
  }> {
    const limits = await this.getTierLimits(userId);
    const {daily, monthly} = this.getPeriodKeys();
    const [dailyUsed, monthlyUsed] = await Promise.all([
      this.getUsage(userId, 'daily', daily),
      this.getUsage(userId, 'monthly', monthly),
    ]);
    return {
      dailyLimit: limits.daily,
      dailyUsed,
      dailyRemaining: Math.max(0, limits.daily - dailyUsed),
      monthlyLimit: limits.monthly,
      monthlyUsed,
      monthlyRemaining: Math.max(0, limits.monthly - monthlyUsed),
    };
  }

  async assertWithinLimits(userId: string, amountUsdt: number): Promise<void> {
    const remaining = await this.getRemaining(userId);
    if (amountUsdt > remaining.dailyRemaining) {
      throw new BadRequestException(
        `Límite diario excedido. Restante: ${remaining.dailyRemaining} USDT`,
      );
    }
    if (amountUsdt > remaining.monthlyRemaining) {
      throw new BadRequestException(
        `Límite mensual excedido. Restante: ${remaining.monthlyRemaining} USDT`,
      );
    }
  }

  async recordUsage(userId: string, amountUsdt: number): Promise<void> {
    const {daily, monthly} = this.getPeriodKeys();
    const amount = new Decimal(amountUsdt);

    for (const [periodType, periodKey] of [
      ['daily', daily],
      ['monthly', monthly],
    ]) {
      const existing = await this.prisma.limitUsage.findUnique({
        where: {
          userId_periodType_periodKey: {userId, periodType, periodKey},
        },
      });
      const newTotal = existing
        ? new Decimal(existing.amountUsdt).plus(amount)
        : amount;
      await this.prisma.limitUsage.upsert({
        where: {
          userId_periodType_periodKey: {userId, periodType, periodKey},
        },
        create: {userId, periodType, periodKey, amountUsdt: amount},
        update: {amountUsdt: newTotal},
      });
    }
  }
}
