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
import {WithdrawalUsaService} from './withdrawal-usa.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {KycVerifiedGuard} from '../common/kyc-verified.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('withdrawal-usa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, KycVerifiedGuard)
@Controller('withdrawal/usa')
export class WithdrawalUsaController {
  constructor(private withdrawalUsa: WithdrawalUsaService) {}

  @Post()
  async create(
    @CurrentUser() user: {id: string},
    @Body() body: {bankAccountId: string; amountUsdt: number; note?: string},
  ) {
    return this.withdrawalUsa.create(user.id, body);
  }

  @Get()
  async list(
    @CurrentUser() user: {id: string},
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.withdrawalUsa.list(
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
    return this.withdrawalUsa.getOne(user.id, id);
  }
}
