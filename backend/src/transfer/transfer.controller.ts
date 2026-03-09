import {Controller, Get, Post, Body, Query, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {TransferService} from './transfer.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {KycVerifiedGuard} from '../common/kyc-verified.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('transfer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transfer')
export class TransferController {
  constructor(private transfer: TransferService) {}

  @Get('search-user')
  async searchUser(
    @CurrentUser() user: {id: string; sub?: string},
    @Query('q') q: string,
  ) {
    const currentUserId = user?.id ?? user?.sub;
    if (!currentUserId) return {users: []};
    return this.transfer.searchUser(q, currentUserId);
  }

  @Post('p2p')
  @UseGuards(KycVerifiedGuard)
  async p2p(
    @CurrentUser() user: {id: string},
    @Body() body: {recipientId: string; amount: number; note?: string; currency?: 'USDT' | 'VES'},
  ) {
    const currency = body.currency ?? 'USDT';
    if (currency === 'VES') {
      return this.transfer.p2pVes(user.id, body.recipientId, body.amount, body.note);
    }
    return this.transfer.p2p(user.id, body.recipientId, body.amount, body.note);
  }

  @Post('merchant')
  @UseGuards(KycVerifiedGuard)
  async merchant(
    @CurrentUser() user: {id: string},
    @Body() body: {merchantId: string; amount: number; method: 'qr' | 'nfc'},
  ) {
    return this.transfer.merchant(user.id, body.merchantId, body.amount, body.method);
  }
}
