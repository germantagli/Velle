import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {ConfigService} from '../config/config.service';
import {ConversionService} from '../conversion/conversion.service';
import {Decimal} from '@prisma/client/runtime/library';

@Injectable()
export class DepositService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private conversion: ConversionService,
  ) {}

  /** Crea solicitud de depósito y genera referencia */
  async create(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Monto inválido');
    const reference = `DEP-${Date.now()}-${userId.slice(-6).toUpperCase()}`;
    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        amount,
        reference,
        status: 'PENDING',
      },
    });
    return {
      id: deposit.id,
      amount,
      reference,
      status: deposit.status,
      instructions: 'Realiza tu pago móvil o transferencia bancaria usando la referencia anterior. El administrador confirmará tu depósito.',
    };
  }

  /** Lista depósitos del usuario */
  async list(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where: {userId},
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.deposit.count({where: {userId}}),
    ]);
    return {
      items: items.map(d => ({
        ...d,
        amount: d.amount.toString(),
      })),
      total,
      page,
      limit,
    };
  }

  /** Confirma un depósito (admin/sistema): acredita balance_ves, opcionalmente convierte a USDT */
  async confirm(depositId: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: {id: depositId},
    });
    if (!deposit) throw new NotFoundException('Depósito no encontrado');
    if (deposit.status !== 'PENDING')
      throw new BadRequestException('Depósito ya procesado');

    const autoConvert = await this.config.getBool('auto_convert_ves_on_deposit');
    const amountVes = Number(deposit.amount);

    await this.prisma.$transaction(async tx => {
      await tx.deposit.update({
        where: {id: depositId},
        data: {status: 'CONFIRMED'},
      });
      const wallet = await tx.wallet.findUnique({
        where: {userId: deposit.userId},
      });
      if (!wallet) throw new NotFoundException('Wallet no encontrada');

      if (autoConvert) {
        const rate = this.conversion.getVesToUsdtRate();
        const usdtGross = amountVes / rate;
        const fee = usdtGross * 0.01;
        const usdtNet = usdtGross - fee;
        await tx.wallet.update({
          where: {userId: deposit.userId},
          data: {
            balanceUsdt: new Decimal(wallet.balanceUsdt).plus(usdtNet),
          },
        });
        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: 'VES_DEPOSIT',
            amount: deposit.amount,
            currency: 'VES',
            status: 'COMPLETED',
            metadata: {
              depositId,
              reference: deposit.reference,
              autoConverted: true,
              usdtReceived: usdtNet,
            },
          },
        });
        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: 'CONVERSION_VES_TO_USDT',
            amount: usdtNet,
            fee,
            currency: 'USDT',
            status: 'COMPLETED',
            metadata: {
              amountVes,
              rate,
              depositId,
              autoConvertOnDeposit: true,
            },
          },
        });
      } else {
        const newBalance = new Decimal(wallet.balanceVes).plus(deposit.amount);
        await tx.wallet.update({
          where: {userId: deposit.userId},
          data: {balanceVes: newBalance},
        });
        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: 'VES_DEPOSIT',
            amount: deposit.amount,
            currency: 'VES',
            status: 'COMPLETED',
            metadata: {depositId, reference: deposit.reference},
          },
        });
      }
    });

    return {status: 'confirmed', autoConverted: autoConvert};
  }

  /** Rechaza un depósito */
  async reject(depositId: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: {id: depositId},
    });
    if (!deposit) throw new NotFoundException('Depósito no encontrado');
    if (deposit.status !== 'PENDING')
      throw new BadRequestException('Depósito ya procesado');

    await this.prisma.deposit.update({
      where: {id: depositId},
      data: {status: 'REJECTED'},
    });
    return {status: 'rejected'};
  }
}
