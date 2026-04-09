import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {DepositService} from './deposit.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('deposit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deposit')
export class DepositController {
  constructor(private deposit: DepositService) {}

  @Post()
  async create(
    @CurrentUser() user: {id: string},
    @Body() body: {amount: number},
  ) {
    return this.deposit.create(user.id, body.amount);
  }

  @Get()
  async list(
    @CurrentUser() user: {id: string},
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.deposit.list(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
  ) {
    return this.deposit.getOne(user.id, id);
  }

  @Post(':id/submit-payment')
  async submitPayment(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
    @Body()
    body: {
      payerPhone: string;
      payerBank: string;
      payerReference?: string;
      payerReceiptUrl?: string;
    },
  ) {
    return this.deposit.submitPayment(user.id, id, body);
  }

  @Post(':id/verify')
  async verify(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
  ) {
    return this.deposit.verify(id, {trigger: 'polling', userId: user.id});
  }

  @Post(':id/manual-review')
  async manualReview(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
    @Body() body: {reason?: string},
  ) {
    return this.deposit.markManualReview(user.id, id, body.reason);
  }
}
