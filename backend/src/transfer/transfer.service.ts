import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {Decimal} from '@prisma/client/runtime/library';
import {NotificationService} from '../notification/notification.service';

@Injectable()
export class TransferService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {}

  async searchUser(query: string, excludeUserId: string) {
    if (!query || query.trim().length < 3 || !excludeUserId) return {users: []};
    const q = query.trim();
    const users = await this.prisma.user.findMany({
      where: {
        id: {not: excludeUserId},
        kycStatus: 'VERIFIED',
        OR: [
          {email: {contains: q, mode: 'insensitive'}},
          {phone: {contains: q}},
          {firstName: {contains: q, mode: 'insensitive'}},
          {lastName: {contains: q, mode: 'insensitive'}},
        ],
      },
      take: 10,
      select: {id: true, email: true, phone: true, firstName: true, lastName: true},
    });
    return {
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        phone: u.phone ?? null,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
    };
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

    const result = await this.prisma.$transaction(async tx => {
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
      return {txOut, senderId, recipientId, amount, recipientName: `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.email};
    });
    const sender = await this.prisma.user.findUnique({
      where: {id: result.senderId},
      select: {firstName: true, lastName: true, email: true},
    });
    const senderName = sender ? (`${sender.firstName} ${sender.lastName}`.trim() || sender.email || 'Alguien') : 'Alguien';
    await this.notification.create({
      userId: result.senderId,
      type: 'TRANSACTION_P2P_SENT',
      title: 'Transferencia enviada',
      body: `Enviaste $${result.amount.toFixed(2)} USDT a ${result.recipientName}.`,
      metadata: {transactionId: result.txOut.id, amount: result.amount, recipientId: result.recipientId},
    });
    await this.notification.create({
      userId: result.recipientId,
      type: 'TRANSACTION_P2P_RECEIVED',
      title: 'Dinero recibido',
      body: `Recibiste $${result.amount.toFixed(2)} USDT de ${senderName}.`,
      metadata: {transactionId: result.txOut.id, amount: result.amount, senderId: result.senderId},
    });
    return result.txOut;
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

    const result = await this.prisma.$transaction(async tx => {
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
      return {txOut, senderId, recipientId, amount, recipientName: `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.email};
    });
    const sender = await this.prisma.user.findUnique({
      where: {id: result.senderId},
      select: {firstName: true, lastName: true, email: true},
    });
    const senderName = sender ? (`${sender.firstName} ${sender.lastName}`.trim() || sender.email || 'Alguien') : 'Alguien';
    await this.notification.create({
      userId: result.senderId,
      type: 'TRANSACTION_P2P_SENT',
      title: 'Transferencia VES enviada',
      body: `Enviaste Bs. ${result.amount.toLocaleString()} a ${result.recipientName}.`,
      metadata: {transactionId: result.txOut.id, amount: result.amount, recipientId: result.recipientId, currency: 'VES'},
    });
    await this.notification.create({
      userId: result.recipientId,
      type: 'TRANSACTION_P2P_RECEIVED',
      title: 'Dinero VES recibido',
      body: `Recibiste Bs. ${result.amount.toLocaleString()} de ${senderName}.`,
      metadata: {transactionId: result.txOut.id, amount: result.amount, senderId: result.senderId, currency: 'VES'},
    });
    return result.txOut;
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

    const result = await this.prisma.$transaction(async tx => {
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
      const txn = await tx.transaction.create({
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
      return {txn, merchant};
    });
    await this.notification.create({
      userId,
      type: 'TRANSACTION_MERCHANT_PAY',
      title: 'Pago a comercio',
      body: `Pagaste $${amount.toFixed(2)} USDT a ${result.merchant.name}.`,
      metadata: {transactionId: result.txn.id, amount, merchantId},
    });
    return result.txn;
  }
}
