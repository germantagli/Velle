import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {Decimal} from '@prisma/client/runtime/library';

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  async searchUser(query: string) {
    if (!query || query.length < 2) return {users: []};
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {email: {contains: query, mode: 'insensitive'}},
          {phone: {contains: query}},
          {
            firstName: {contains: query, mode: 'insensitive'},
          },
          {lastName: {contains: query, mode: 'insensitive'}},
        ],
        kycStatus: 'VERIFIED',
      },
      take: 10,
      select: {id: true, email: true, firstName: true, lastName: true},
    });
    return {users};
  }

  /** P2P en USDT */
  async p2p(
    senderId: string,
    recipientId: string,
    amount: number,
    note?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('Monto inválido');
    if (senderId === recipientId)
      throw new BadRequestException('No puedes transferirte a ti mismo');
    const recipient = await this.prisma.user.findUnique({
      where: {id: recipientId},
    });
    if (!recipient) throw new NotFoundException('Destinatario no encontrado');

    return this.prisma.$transaction(async tx => {
      const [senderWallet, recipientWallet] = await Promise.all([
        tx.wallet.findUnique({where: {userId: senderId}}),
        tx.wallet.findUnique({where: {userId: recipientId}}),
      ]);
      if (!senderWallet || !recipientWallet)
        throw new NotFoundException('Wallet no encontrada');
      const bal = new Decimal(senderWallet.balanceUsdt);
      if (bal.lt(amount))
        throw new BadRequestException('Saldo USDT insuficiente');

      await tx.wallet.update({
        where: {userId: senderId},
        data: {balanceUsdt: bal.minus(amount)},
      });
      await tx.wallet.update({
        where: {userId: recipientId},
        data: {balanceUsdt: new Decimal(recipientWallet.balanceUsdt).plus(amount)},
      });
      const txOut = await tx.transaction.create({
        data: {
          userId: senderId,
          type: 'P2P',
          amount,
          currency: 'USDT',
          status: 'COMPLETED',
          recipientId,
          metadata: {note, direction: 'out'},
        },
      });
      await tx.transaction.create({
        data: {
          userId: recipientId,
          type: 'P2P',
          amount,
          currency: 'USDT',
          status: 'COMPLETED',
          recipientId: senderId,
          metadata: {note, direction: 'in'},
        },
      });
      return txOut;
    });
  }

  /** P2P en VES (bolívares) */
  async p2pVes(
    senderId: string,
    recipientId: string,
    amount: number,
    note?: string,
  ) {
    if (amount <= 0) throw new BadRequestException('Monto inválido');
    if (senderId === recipientId)
      throw new BadRequestException('No puedes transferirte a ti mismo');
    const recipient = await this.prisma.user.findUnique({
      where: {id: recipientId},
    });
    if (!recipient) throw new NotFoundException('Destinatario no encontrado');

    return this.prisma.$transaction(async tx => {
      const [senderWallet, recipientWallet] = await Promise.all([
        tx.wallet.findUnique({where: {userId: senderId}}),
        tx.wallet.findUnique({where: {userId: recipientId}}),
      ]);
      if (!senderWallet || !recipientWallet)
        throw new NotFoundException('Wallet no encontrada');
      const bal = new Decimal(senderWallet.balanceVes);
      if (bal.lt(amount))
        throw new BadRequestException('Saldo VES insuficiente');

      await tx.wallet.update({
        where: {userId: senderId},
        data: {balanceVes: bal.minus(amount)},
      });
      await tx.wallet.update({
        where: {userId: recipientId},
        data: {balanceVes: new Decimal(recipientWallet.balanceVes).plus(amount)},
      });
      const txOut = await tx.transaction.create({
        data: {
          userId: senderId,
          type: 'P2P_VES',
          amount,
          currency: 'VES',
          status: 'COMPLETED',
          recipientId,
          metadata: {note, direction: 'out'},
        },
      });
      await tx.transaction.create({
        data: {
          userId: recipientId,
          type: 'P2P_VES',
          amount,
          currency: 'VES',
          status: 'COMPLETED',
          recipientId: senderId,
          metadata: {note, direction: 'in'},
        },
      });
      return txOut;
    });
  }

  async merchant(
    userId: string,
    merchantId: string,
    amount: number,
    method: 'qr' | 'nfc',
  ) {
    if (amount <= 0) throw new BadRequestException('Monto inválido');
    const merchant = await this.prisma.merchant.findUnique({
      where: {id: merchantId, status: 'active'},
    });
    if (!merchant) throw new NotFoundException('Comercio no encontrado');

    return this.prisma.$transaction(async tx => {
      const wallet = await tx.wallet.findUnique({
        where: {userId},
      });
      if (!wallet) throw new NotFoundException('Wallet no encontrada');
      const bal = new Decimal(wallet.balanceUsdt);
      if (bal.lt(amount))
        throw new BadRequestException('Saldo insuficiente');

      await tx.wallet.update({
        where: {userId},
        data: {balanceUsdt: bal.minus(amount)},
      });
      return tx.transaction.create({
        data: {
          userId,
          type: 'MERCHANT_PAY',
          amount,
          currency: 'USDT',
          status: 'COMPLETED',
          merchantId,
          metadata: {method},
        },
      });
    });
  }
}
