import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {DepositStatus} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';
import {ConfigService} from '../config/config.service';
import {ConversionService} from '../conversion/conversion.service';
import {Decimal} from '@prisma/client/runtime/library';
import {NotificationService} from '../notification/notification.service';
import {BanescoMockProvider} from './providers/banesco-mock.provider';

@Injectable()
export class DepositService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private conversion: ConversionService,
    private notifications: NotificationService,
    private banescoProvider: BanescoMockProvider,
  ) {}

  /** Crea orden de depósito VES con monto exacto anti-colisión */
  async create(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Monto inválido');
    const amountRequested = Math.round(amount * 100) / 100;
    const exactAmountToPay = this.buildExactAmount(amountRequested);
    const reference = `DEP-${Date.now()}-${userId.slice(-6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        amount: exactAmountToPay,
        amountRequested,
        exactAmountToPay,
        reference,
        status: 'PENDING_PAYMENT',
        expiresAt,
      },
    });

    return this.toClientOrder(deposit);
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
      items: items.map(d => this.toClientOrder(d)),
      total,
      page,
      limit,
    };
  }

  async getOne(userId: string, depositId: string) {
    const deposit = await this.prisma.deposit.findFirst({
      where: {id: depositId, userId},
    });
    if (!deposit) throw new NotFoundException('Depósito no encontrado');
    await this.expireIfNeeded(deposit.id, deposit.status, deposit.expiresAt);
    const refreshed = await this.prisma.deposit.findUnique({where: {id: deposit.id}});
    return this.toClientOrder(refreshed ?? deposit);
  }

  async submitPayment(
    userId: string,
    depositId: string,
    payload: {
      payerPhone: string;
      payerBank: string;
      payerReference?: string;
      payerReceiptUrl?: string;
    },
  ) {
    if (!/^\d{10,15}$/.test(payload.payerPhone)) {
      throw new BadRequestException('Formato de teléfono inválido');
    }
    if (!payload.payerBank?.trim()) {
      throw new BadRequestException('Banco origen es requerido');
    }

    const deposit = await this.prisma.deposit.findFirst({
      where: {id: depositId, userId},
    });
    if (!deposit) throw new NotFoundException('Depósito no encontrado');
    await this.expireIfNeeded(deposit.id, deposit.status, deposit.expiresAt);

    const refreshed = await this.prisma.deposit.findUnique({where: {id: deposit.id}});
    if (!refreshed) throw new NotFoundException('Depósito no encontrado');
    if (refreshed.status === 'EXPIRED') {
      throw new BadRequestException('La orden está expirada');
    }
    if (refreshed.status === 'CONFIRMED') {
      return this.toClientOrder(refreshed);
    }
    if (refreshed.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('La orden ya fue enviada para verificación');
    }

    const updated = await this.prisma.deposit.update({
      where: {id: depositId},
      data: {
        status: 'PAYMENT_SUBMITTED',
        paymentSubmittedAt: new Date(),
        payerPhone: payload.payerPhone.trim(),
        payerBank: payload.payerBank.trim(),
        payerReference: payload.payerReference?.trim() || null,
        payerReceiptUrl: payload.payerReceiptUrl?.trim() || null,
      },
    });

    return this.verify(depositId, {trigger: 'user_submit', userId});
  }

  async verify(
    depositId: string,
    opts?: {trigger?: 'polling' | 'user_submit' | 'manual_retry'; userId?: string},
  ) {
    const deposit = await this.prisma.deposit.findUnique({
      where: {id: depositId},
    });
    if (!deposit) throw new NotFoundException('Depósito no encontrado');
    await this.expireIfNeeded(deposit.id, deposit.status, deposit.expiresAt);
    const current = await this.prisma.deposit.findUnique({where: {id: depositId}});
    if (!current) throw new NotFoundException('Depósito no encontrado');
    if (opts?.userId && current.userId !== opts.userId) {
      throw new NotFoundException('Depósito no encontrado');
    }
    if (current.status === 'CONFIRMED' || current.status === 'REJECTED' || current.status === 'EXPIRED') {
      return this.toClientOrder(current);
    }
    if (!current.payerPhone || !current.payerBank) {
      throw new BadRequestException('Aún no se ha reportado el pago');
    }

    if (current.status === 'PAYMENT_SUBMITTED') {
      await this.prisma.deposit.update({
        where: {id: current.id},
        data: {
          status: 'VERIFICATION_PENDING',
          verificationStartedAt: new Date(),
        },
      });
    }

    const providerResult = await this.banescoProvider.confirmDeposit({
      reference: current.payerReference ?? current.reference,
      phone: current.payerPhone,
      bank: current.payerBank,
      amount: Number(current.exactAmountToPay),
      date: current.paymentSubmittedAt ?? new Date(),
    });

    if (providerResult.outcome === 'MATCH') {
      await this.confirm(current.id, {
        reconciliationRef: providerResult.reconciliationRef,
        providerResult,
      });
    } else if (providerResult.outcome === 'NOT_FOUND') {
      await this.prisma.deposit.update({
        where: {id: current.id},
        data: {
          status: 'VERIFICATION_PENDING',
          bankProviderResult: providerResult as unknown as object,
        },
      });
    } else if (providerResult.outcome === 'MULTIPLE_MATCHES' || providerResult.outcome === 'SUSPICIOUS') {
      await this.prisma.deposit.update({
        where: {id: current.id},
        data: {
          status: 'MANUAL_REVIEW',
          manualReviewReason:
            providerResult.outcome === 'SUSPICIOUS'
              ? providerResult.reason
              : 'Múltiples coincidencias detectadas',
          bankProviderResult: providerResult as unknown as object,
        },
      });
      await this.notifications.notifyAdmins({
        type: 'TRANSACTION_DEPOSIT',
        title: 'Depósito requiere revisión manual',
        body: `El depósito ${current.reference} requiere revisión manual.`,
        metadata: {depositId: current.id, reason: providerResult.outcome},
      });
    } else {
      await this.prisma.deposit.update({
        where: {id: current.id},
        data: {
          status: 'VERIFICATION_PENDING',
          bankProviderResult: providerResult as unknown as object,
        },
      });
    }

    const updated = await this.prisma.deposit.findUnique({where: {id: current.id}});
    if (!updated) throw new NotFoundException('Depósito no encontrado');
    return this.toClientOrder(updated);
  }

  async markManualReview(userId: string, depositId: string, reason?: string) {
    const deposit = await this.prisma.deposit.findFirst({
      where: {id: depositId, userId},
    });
    if (!deposit) throw new NotFoundException('Depósito no encontrado');
    if (
      deposit.status === 'CONFIRMED' ||
      deposit.status === 'REJECTED' ||
      deposit.status === 'EXPIRED'
    ) {
      return this.toClientOrder(deposit);
    }

    const updated = await this.prisma.deposit.update({
      where: {id: depositId},
      data: {
        status: 'MANUAL_REVIEW',
        manualReviewReason: reason?.trim() || 'Solicitado por usuario',
      },
    });
    await this.notifications.notifyAdmins({
      type: 'TRANSACTION_DEPOSIT',
      title: 'Usuario solicitó revisión manual',
      body: `Depósito ${updated.reference} enviado a revisión manual.`,
      metadata: {depositId: updated.id, reason: updated.manualReviewReason},
    });
    return this.toClientOrder(updated);
  }

  /** Confirma un depósito (admin/sistema): acredita balance_ves, opcionalmente convierte a USDT */
  async confirm(
    depositId: string,
    opts?: {
      reconciliationRef?: string;
      providerResult?: Record<string, unknown>;
      reviewedBy?: string;
    },
  ) {
    const deposit = await this.prisma.deposit.findUnique({
      where: {id: depositId},
    });
    if (!deposit) throw new NotFoundException('Depósito no encontrado');
    if (deposit.status === 'CONFIRMED') {
      return {status: 'confirmed', autoConverted: false, alreadyConfirmed: true};
    }
    if (deposit.status === 'REJECTED' || deposit.status === 'EXPIRED')
      throw new BadRequestException('Depósito ya procesado');

    const autoConvert = await this.config.getBool('auto_convert_ves_on_deposit');
    const amountVes = Number(deposit.exactAmountToPay);

    await this.prisma.$transaction(async tx => {
      await tx.deposit.update({
        where: {id: depositId},
        data: {
          status: 'CONFIRMED',
          verifiedAt: new Date(),
          confirmedAt: new Date(),
          bankReconciliationRef: opts?.reconciliationRef ?? deposit.bankReconciliationRef ?? null,
          bankProviderResult: opts?.providerResult
            ? (opts.providerResult as object)
            : deposit.bankProviderResult,
          reviewedBy: opts?.reviewedBy ?? deposit.reviewedBy ?? null,
          reviewedAt: opts?.reviewedBy ? new Date() : deposit.reviewedAt,
        },
      });
      const wallet = await tx.wallet.findUnique({
        where: {userId: deposit.userId},
      });
      if (!wallet) throw new NotFoundException('Wallet no encontrada');
      if (deposit.creditedAt) return;

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
      await tx.deposit.update({
        where: {id: depositId},
        data: {creditedAt: new Date()},
      });
    });

    await this.notifications.create({
      userId: deposit.userId,
      type: 'TRANSACTION_DEPOSIT',
      title: 'Depósito VES confirmado',
      body: `Tu depósito ${deposit.reference} fue confirmado y acreditado.`,
      metadata: {depositId: deposit.id, reference: deposit.reference},
    });
    return {status: 'confirmed', autoConverted: autoConvert};
  }

  /** Rechaza un depósito */
  async reject(depositId: string, reason?: string, reviewedBy?: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: {id: depositId},
    });
    if (!deposit) throw new NotFoundException('Depósito no encontrado');
    if (deposit.status === 'REJECTED') return {status: 'rejected', alreadyRejected: true};
    if (deposit.status === 'CONFIRMED' || deposit.status === 'EXPIRED')
      throw new BadRequestException('Depósito ya procesado');

    await this.prisma.deposit.update({
      where: {id: depositId},
      data: {
        status: 'REJECTED',
        manualReviewReason: reason?.trim() || deposit.manualReviewReason,
        reviewedBy: reviewedBy ?? deposit.reviewedBy,
        reviewedAt: new Date(),
      },
    });
    await this.notifications.create({
      userId: deposit.userId,
      type: 'TRANSACTION_DEPOSIT',
      title: 'Depósito rechazado',
      body: `No pudimos confirmar tu depósito ${deposit.reference}.`,
      metadata: {depositId: deposit.id, reference: deposit.reference, reason},
    });
    return {status: 'rejected'};
  }

  async adminList(status?: DepositStatus) {
    const items = await this.prisma.deposit.findMany({
      where: status ? {status} : undefined,
      include: {
        user: {
          select: {id: true, email: true, firstName: true, lastName: true, phone: true},
        },
      },
      orderBy: {createdAt: 'desc'},
      take: 200,
    });
    return {items: items.map(d => this.toClientOrder(d))};
  }

  async adminGetOne(depositId: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: {id: depositId},
      include: {
        user: {
          select: {id: true, email: true, firstName: true, lastName: true, phone: true},
        },
      },
    });
    if (!deposit) throw new NotFoundException('Depósito no encontrado');
    return this.toClientOrder(deposit);
  }

  private buildExactAmount(amountRequested: number): number {
    const decimal = ((Date.now() % 89) + 11) / 100;
    return Math.round((amountRequested + decimal) * 100) / 100;
  }

  private async expireIfNeeded(id: string, status: string, expiresAt: Date) {
    if (
      new Date() > expiresAt &&
      (status === 'PENDING_PAYMENT' || status === 'PAYMENT_SUBMITTED' || status === 'VERIFICATION_PENDING')
    ) {
      await this.prisma.deposit.update({
        where: {id},
        data: {status: 'EXPIRED'},
      });
    }
  }

  private toClientOrder(
    d: any,
  ): {
    id: string;
    amount: string;
    amountRequested: string;
    exactAmountToPay: string;
    reference: string;
    status: string;
    expiresAt: Date;
    payerPhone?: string | null;
    payerBank?: string | null;
    payerReference?: string | null;
    payerReceiptUrl?: string | null;
    bankReconciliationRef?: string | null;
    manualReviewReason?: string | null;
    bankProviderResult?: unknown;
    createdAt: Date;
    updatedAt?: Date;
    user?: {id: string; email: string; firstName: string; lastName: string; phone: string | null};
    instructions: {
      bankName: string;
      receiverPhone: string;
      receiverDocument: string;
      amountToTransfer: string;
    };
  } {
    return {
      ...d,
      amount: d.amount.toString(),
      amountRequested: d.amountRequested.toString(),
      exactAmountToPay: d.exactAmountToPay.toString(),
      instructions: {
        bankName: 'Banesco',
        receiverPhone: '04121234567',
        receiverDocument: 'J-12345678-9',
        amountToTransfer: d.exactAmountToPay.toString(),
      },
    };
  }
}
