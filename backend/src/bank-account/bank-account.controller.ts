import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {BankAccountService} from './bank-account.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {KycVerifiedGuard} from '../common/kyc-verified.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('bank-accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, KycVerifiedGuard)
@Controller('bank-accounts')
export class BankAccountController {
  constructor(private bankAccount: BankAccountService) {}

  @Post()
  async create(
    @CurrentUser() user: {id: string},
    @Body()
    body: {
      accountHolder: string;
      accountNumber: string;
      routingNumber: string;
      accountType: string;
      bankName?: string;
    },
  ) {
    return this.bankAccount.create(user.id, body);
  }

  @Get()
  async list(@CurrentUser() user: {id: string}) {
    return this.bankAccount.list(user.id);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
  ) {
    return this.bankAccount.delete(user.id, id);
  }
}
