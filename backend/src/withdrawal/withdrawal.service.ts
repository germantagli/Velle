import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class WithdrawalService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: {userId},
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.withdrawal.count({where: {userId}}),
    ]);
    return {
      items: items.map(w => ({
        ...w,
        amount: w.amount.toString(),
      })),
      total,
      page,
      limit,
    };
  }
}
