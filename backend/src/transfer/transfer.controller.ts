import {Controller, Get, Post, Body, Query, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {TransferService} from './transfer.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('transfer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transfer')
export class TransferController {
  constructor(private transfer: TransferService) {}

  @Get('search-user')
  async searchUser(
    @CurrentUser() _user: {id: string},
    @Query('q') q: string,
  ) {
    return this.transfer.searchUser(q);
  }

  @Post('p2p')
  async p2p(
    @CurrentUser() user: {id: string},
    @Body() body: {recipientId: string; amount: number; note?: string},
  ) {
    return this.transfer.p2p(user.id, body.recipientId, body.amount, body.note);
  }

  @Post('merchant')
  async merchant(
    @CurrentUser() user: {id: string},
    @Body() body: {merchantId: string; amount: number; method: 'qr' | 'nfc'},
  ) {
    return this.transfer.merchant(user.id, body.merchantId, body.amount, body.method);
  }
}
