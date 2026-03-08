import {Injectable} from '@nestjs/common';
import {TransactionType} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: {userId},
    });
    return {
      balanceVes: wallet?.balanceVes.toString() ?? '0',
      balanceUsdt: wallet?.balanceUsdt.toString() ?? '0',
      balance: wallet?.balanceUsdt.toString() ?? '0',
      currency: 'USDT',
    };
  }

  async getTransaction(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: {id, userId},
    });
    if (!tx) return null;
    return {
      ...tx,
      amount: tx.amount.toString(),
      fee: tx.fee.toString(),
    };
  }

  async getTransactions(
    userId: string,
    page = 1,
    limit = 20,
    type?: string,
  ) {
    const where: {userId: string; type?: TransactionType} = {userId};
    if (type) where.type = type as TransactionType;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({where}),
    ]);
    const serialized = items.map(i => ({
      ...i,
      amount: i.amount.toString(),
      fee: i.fee.toString(),
    }));
    return {items: serialized, total, page, limit};
  }
}
