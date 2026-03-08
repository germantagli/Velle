import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const cards = await this.prisma.virtualCard.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
    });
    const wallet = await this.prisma.wallet.findUnique({
      where: {userId},
    });
    const balance = wallet?.balanceUsdt.toString() ?? '0';
    return {
      cards: cards.map(c => ({
        id: c.id,
        lastFour: c.lastFour,
        brand: c.brand,
        expiryMonth: c.expiryMonth,
        expiryYear: c.expiryYear,
        frozen: c.frozen,
        balance,
      })),
    };
  }

  async create(userId: string) {
    const lastFour = String(Math.floor(1000 + Math.random() * 9000));
    const now = new Date();
    const expiryMonth = now.getMonth() + 1;
    const expiryYear = now.getFullYear() + 3;
    const card = await this.prisma.virtualCard.create({
      data: {
        userId,
        lastFour,
        brand: 'visa',
        expiryMonth,
        expiryYear,
      },
    });
    const wallet = await this.prisma.wallet.findUnique({
      where: {userId},
    });
    return {
      ...card,
      balance: wallet?.balanceUsdt.toString() ?? '0',
    };
  }

  async getDetails(userId: string, cardId: string) {
    const card = await this.prisma.virtualCard.findFirst({
      where: {id: cardId, userId},
    });
    if (!card) return null;
    const wallet = await this.prisma.wallet.findUnique({
      where: {userId},
    });
    return {
      ...card,
      balance: wallet?.balanceUsdt.toString() ?? '0',
    };
  }

  async toggleFreeze(userId: string, cardId: string, frozen: boolean) {
    return this.prisma.virtualCard.updateMany({
      where: {id: cardId, userId},
      data: {frozen},
    });
  }
}
