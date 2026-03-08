import {Injectable, BadRequestException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {Decimal} from '@prisma/client/runtime/library';

const CONVERSION_FEE_PERCENT = 1;

@Injectable()
export class ConversionService {
  constructor(private prisma: PrismaService) {}

  /** Obtiene la tasa VES/USDT (puede venir de API externa o env) */
  getVesToUsdtRate(): number {
    const rate = process.env.VES_USDT_RATE || '36';
    return parseFloat(rate);
  }

  /** VES → USDT: balance_ves -= amount, balance_usdt += usdt (con comisión 1%) */
  async vesToUsdt(userId: string, amountVes: number) {
    if (amountVes <= 0) throw new BadRequestException('Monto inválido');
    const rate = this.getVesToUsdtRate();
    const usdtGross = amountVes / rate;
    const fee = usdtGross * (CONVERSION_FEE_PERCENT / 100);
    const usdtNet = usdtGross - fee;

    return this.prisma.$transaction(async tx => {
      const wallet = await tx.wallet.findUnique({
        where: {userId},
      });
      if (!wallet) throw new BadRequestException('Wallet no encontrada');
      const balVes = new Decimal(wallet.balanceVes);
      if (balVes.lt(amountVes))
        throw new BadRequestException('Saldo en VES insuficiente');

      await tx.wallet.update({
        where: {userId},
        data: {
          balanceVes: balVes.minus(amountVes),
          balanceUsdt: new Decimal(wallet.balanceUsdt).plus(usdtNet),
        },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: 'CONVERSION_VES_TO_USDT',
          amount: usdtNet,
          fee,
          currency: 'USDT',
          status: 'COMPLETED',
          metadata: {
            amountVes,
            rate,
            feePercent: CONVERSION_FEE_PERCENT,
          },
        },
      });
      return {
        amountVes,
        usdtReceived: usdtNet,
        fee,
        rate,
      };
    });
  }

  /** USDT → VES: balance_usdt -= usdt, balance_ves += ves (con comisión 1%) */
  async usdtToVes(userId: string, amountUsdt: number) {
    if (amountUsdt <= 0) throw new BadRequestException('Monto inválido');
    const rate = this.getVesToUsdtRate();
    const vesGross = amountUsdt * rate;
    const fee = vesGross * (CONVERSION_FEE_PERCENT / 100);
    const vesNet = vesGross - fee;

    return this.prisma.$transaction(async tx => {
      const wallet = await tx.wallet.findUnique({
        where: {userId},
      });
      if (!wallet) throw new BadRequestException('Wallet no encontrada');
      const balUsdt = new Decimal(wallet.balanceUsdt);
      if (balUsdt.lt(amountUsdt))
        throw new BadRequestException('Saldo en USDT insuficiente');

      await tx.wallet.update({
        where: {userId},
        data: {
          balanceUsdt: balUsdt.minus(amountUsdt),
          balanceVes: new Decimal(wallet.balanceVes).plus(vesNet),
        },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: 'CONVERSION_USDT_TO_VES',
          amount: vesNet,
          fee,
          currency: 'VES',
          status: 'COMPLETED',
          metadata: {
            amountUsdt,
            rate,
            feePercent: CONVERSION_FEE_PERCENT,
          },
        },
      });
      return {
        amountUsdt,
        vesReceived: vesNet,
        fee,
        rate,
      };
    });
  }
}
