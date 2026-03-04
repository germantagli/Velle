import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: {userId},
    });
    return {
      balance: wallet?.balance.toString() ?? '0',
      currency: 'USDT',
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {userId},
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({where: {userId}}),
    ]);
    return {items, total, page, limit};
  }
}
