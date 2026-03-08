import {Controller, Get, Query, Param, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {WalletService} from './wallet.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private wallet: WalletService) {}

  @Get('balance')
  async balance(@CurrentUser() user: {id: string}) {
    return this.wallet.getBalance(user.id);
  }

  @Get('transactions/:id')
  async transaction(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
  ) {
    return this.wallet.getTransaction(user.id, id);
  }

  @Get('transactions')
  async transactions(
    @CurrentUser() user: {id: string},
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.wallet.getTransactions(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      type,
    );
  }
}
