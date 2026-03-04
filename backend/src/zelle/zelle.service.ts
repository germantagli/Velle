import {Injectable, BadRequestException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {Decimal} from '@prisma/client/runtime/library';

const CORPORATE_ZELLE_EMAIL =
  process.env.ZELLE_CORPORATE_EMAIL || 'deposits@velle.app';
const ZELLE_FEE_PERCENT = 2;

@Injectable()
export class ZelleService {
  constructor(private prisma: PrismaService) {}

  async requestDeposit(userId: string, amount: number, zelleEmail: string) {
    if (amount <= 0) throw new BadRequestException('Monto inválido');
    const reference = `ZELLE-${Date.now()}-${userId.slice(-6)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return {
      reference,
      amount,
      zelleEmail,
      corporateZelleEmail: CORPORATE_ZELLE_EMAIL,
      instructions:
        'Envía el monto desde tu app Zelle a la cuenta corporativa. Incluye la referencia en el memo.',
      expiresAt: expiresAt.toISOString(),
    };
  }

  async sendToZelle(
    userId: string,
    amount: number,
    zelleEmail: string,
    note?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('Monto inválido');
    const fee = amount * (ZELLE_FEE_PERCENT / 100);
    const total = amount + fee;

    const tx = await this.prisma.$transaction(async txPrisma => {
      const wallet = await txPrisma.wallet.findUnique({
        where: {userId},
      });
      if (!wallet) throw new BadRequestException('Wallet no encontrada');
      const bal = new Decimal(wallet.balance);
      if (bal.lt(total))
        throw new BadRequestException('Saldo insuficiente');

      await txPrisma.wallet.update({
        where: {userId},
        data: {balance: bal.minus(total)},
      });
      const transaction = await txPrisma.transaction.create({
        data: {
          userId,
          type: 'ZELLE_OUT',
          amount: total,
          fee,
          status: 'COMPLETED',
          metadata: {zelleEmail, note},
        },
      });
      return transaction;
    });

    return {
      id: tx.id,
      status: 'completed',
      amount,
      zelleEmail,
    };
  }
}
