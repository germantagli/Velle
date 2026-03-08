import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {DwollaService} from '../dwolla/dwolla.service';
import {LimitsService} from '../limits/limits.service';
import {Decimal} from '@prisma/client/runtime/library';

const USA_WITHDRAWAL_FEE_PERCENT = 2.5;

@Injectable()
export class WithdrawalUsaService {
  constructor(
    private prisma: PrismaService,
    private dwolla: DwollaService,
    private limits: LimitsService,
  ) {}

  private calculateFee(amountUsdt: number): number {
    return amountUsdt * (USA_WITHDRAWAL_FEE_PERCENT / 100);
  }

  async create(
    userId: string,
    dto: {bankAccountId: string; amountUsdt: number; note?: string},
  ) {
    if (dto.amountUsdt <= 0) throw new BadRequestException('Monto inválido');

    await this.limits.assertWithinLimits(userId, dto.amountUsdt);

    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {id: dto.bankAccountId, userId},
    });
    if (!bankAccount) throw new NotFoundException('Cuenta bancaria no encontrada');
    if (bankAccount.status !== 'verified' && bankAccount.status !== 'pending') {
      throw new BadRequestException('Cuenta no disponible para retiros');
    }

    const usdAmount = dto.amountUsdt;
    const fee = this.calculateFee(dto.amountUsdt);
    const total = new Decimal(dto.amountUsdt).plus(fee);

    const result = await this.prisma.$transaction(async tx => {
      const wallet = await tx.wallet.findUnique({
        where: {userId},
      });
      if (!wallet) throw new NotFoundException('Wallet no encontrada');
      const balUsdt = new Decimal(wallet.balanceUsdt);
      if (balUsdt.lt(total))
        throw new BadRequestException('Saldo insuficiente');

      await tx.wallet.update({
        where: {userId},
        data: {balanceUsdt: balUsdt.minus(total)},
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount: dto.amountUsdt,
          destination: 'usa_bank',
          bankAccountId: bankAccount.id,
          usdAmount,
          fee,
          etaMinutes: 30,
          status: 'PENDING',
          metadata: {note: dto.note},
        },
      });

      try {
        const destId =
          bankAccount.externalId || `sandbox-${bankAccount.id}`;
        const transfer = await this.dwolla.createTransfer({
          sourceFundingSourceId:
            process.env.DWOLLA_FUNDING_SOURCE_ID || 'platform-master',
          destinationFundingSourceId: destId,
          amount: usdAmount,
          currency: 'USD',
        });

        await tx.withdrawal.update({
          where: {id: withdrawal.id},
          data: {
            partnerTransferId: transfer.id,
            status: 'PROCESSING',
            metadata: {
              ...((withdrawal.metadata as object) || {}),
              dwollaTransferId: transfer.id,
            },
          },
        });

        await this.limits.recordUsage(userId, dto.amountUsdt);

        await tx.transaction.create({
          data: {
            userId,
            type: 'USA_BANK_WITHDRAWAL',
            amount: dto.amountUsdt,
            fee,
            currency: 'USDT',
            status: 'COMPLETED',
            metadata: {
              withdrawalId: withdrawal.id,
              bankAccountId: bankAccount.id,
              usdAmount,
            },
          },
        });

        return {withdrawal, fee, etaMinutes: transfer.etaMinutes ?? 30};
      } catch (err: any) {
        await tx.withdrawal.update({
          where: {id: withdrawal.id},
          data: {
            status: 'FAILED',
            metadata: {
              ...((withdrawal.metadata as object) || {}),
              error: err?.message || 'Unknown error',
            },
          },
        });
        await tx.wallet.update({
          where: {userId},
          data: {balanceUsdt: balUsdt},
        });
        throw new BadRequestException(
          err?.message || 'Error al procesar el retiro. Intenta más tarde.',
        );
      }
    });

    const w = result.withdrawal;
    const eta = result.etaMinutes;
    const completedAt = new Date();
    completedAt.setMinutes(completedAt.getMinutes() + eta);

    return {
      id: w.id,
      status: 'PROCESSING',
      amountUsdt: Number(w.amount),
      usdAmount: Number(w.usdAmount),
      fee: result.fee,
      etaMinutes: eta,
      estimatedCompletion: completedAt.toISOString(),
    };
  }

  async list(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: {userId, destination: 'usa_bank'},
        orderBy: {createdAt: 'desc'},
        include: {bankAccount: {select: {lastFour: true, accountHolder: true}}},
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.withdrawal.count({
        where: {userId, destination: 'usa_bank'},
      }),
    ]);
    return {
      items: items.map(w => ({
        id: w.id,
        amount: w.amount.toString(),
        usdAmount: w.usdAmount?.toString(),
        fee: w.fee?.toString(),
        status: w.status,
        etaMinutes: w.etaMinutes,
        lastFour: w.bankAccount?.lastFour,
        accountHolder: w.bankAccount?.accountHolder,
        createdAt: w.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getOne(userId: string, id: string) {
    const w = await this.prisma.withdrawal.findFirst({
      where: {id, userId, destination: 'usa_bank'},
      include: {bankAccount: true},
    });
    if (!w) throw new NotFoundException('Retiro no encontrado');
    return {
      id: w.id,
      amount: w.amount.toString(),
      usdAmount: w.usdAmount?.toString(),
      fee: w.fee?.toString(),
      status: w.status,
      etaMinutes: w.etaMinutes,
      bankAccount: w.bankAccount
        ? {
            lastFour: w.bankAccount.lastFour,
            accountHolder: w.bankAccount.accountHolder,
          }
        : null,
      createdAt: w.createdAt,
      metadata: w.metadata,
    };
  }

  async handleTransferCompleted(partnerTransferId: string) {
    const w = await this.prisma.withdrawal.findFirst({
      where: {partnerTransferId},
    });
    if (!w) return;
    await this.prisma.withdrawal.update({
      where: {id: w.id},
      data: {status: 'COMPLETED'},
    });
  }

  async handleTransferFailed(partnerTransferId: string) {
    const w = await this.prisma.withdrawal.findFirst({
      where: {partnerTransferId},
    });
    if (!w) return;
    await this.prisma.$transaction(async tx => {
      await tx.withdrawal.update({
        where: {id: w.id},
        data: {status: 'FAILED'},
      });
      const wallet = await tx.wallet.findUnique({
        where: {userId: w.userId},
      });
      if (wallet) {
        const total = new Decimal(w.amount).plus(w.fee || 0);
        await tx.wallet.update({
          where: {userId: w.userId},
          data: {
            balanceUsdt: new Decimal(wallet.balanceUsdt).plus(total),
          },
        });
      }
    });
  }
}
