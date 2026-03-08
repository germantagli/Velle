import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {DwollaService} from '../dwolla/dwolla.service';

@Injectable()
export class BankAccountService {
  constructor(
    private prisma: PrismaService,
    private dwolla: DwollaService,
  ) {}

  async create(
    userId: string,
    dto: {
      accountHolder: string;
      accountNumber: string;
      routingNumber: string;
      accountType: string;
      bankName?: string;
    },
  ) {
    const lastFour = dto.accountNumber.slice(-4);
    const validation = await this.dwolla.validateBankAccount(
      dto.accountHolder,
      dto.accountNumber,
      dto.routingNumber,
      dto.accountType,
    );
    const status = validation.valid ? 'verified' : 'pending';
    const externalId = validation.externalId;

    const account = await this.prisma.bankAccount.create({
      data: {
        userId,
        accountHolder: dto.accountHolder,
        accountNumber: dto.accountNumber,
        routingNumber: dto.routingNumber,
        accountType: dto.accountType,
        bankName: dto.bankName,
        lastFour,
        status,
        externalId,
      },
    });
    return {
      id: account.id,
      accountHolder: account.accountHolder,
      lastFour: account.lastFour,
      accountType: account.accountType,
      bankName: account.bankName,
      status: account.status,
    };
  }

  async list(userId: string) {
    const accounts = await this.prisma.bankAccount.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
    });
    return accounts.map(a => ({
      id: a.id,
      accountHolder: a.accountHolder,
      lastFour: a.lastFour,
      accountType: a.accountType,
      bankName: a.bankName,
      status: a.status,
    }));
  }

  async delete(userId: string, accountId: string) {
    const account = await this.prisma.bankAccount.findFirst({
      where: {id: accountId, userId},
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    await this.prisma.bankAccount.delete({where: {id: accountId}});
    return {deleted: true};
  }

  async validateAndSetVerified(accountId: string, externalId: string) {
    await this.prisma.bankAccount.update({
      where: {id: accountId},
      data: {externalId, status: 'verified'},
    });
  }
}
