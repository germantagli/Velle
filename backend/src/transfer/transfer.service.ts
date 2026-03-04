import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  async p2p(senderId: string, recipientId: string, amount: number, note?: string) {
    // TODO: Usar transacción DB, validar saldo, crear registros
    return this.prisma.transaction.create({
      data: {
        userId: senderId,
        type: 'P2P',
        amount,
        status: 'COMPLETED',
        recipientId,
        metadata: {note},
      },
    });
  }

  async merchant(userId: string, merchantId: string, amount: number, method: 'qr' | 'nfc') {
    return this.prisma.transaction.create({
      data: {
        userId,
        type: 'MERCHANT_PAY',
        amount,
        status: 'COMPLETED',
        merchantId,
        metadata: {method},
      },
    });
  }
}
