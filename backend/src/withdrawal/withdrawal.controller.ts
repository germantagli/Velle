import {Controller, Get, Query, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {WithdrawalService} from './withdrawal.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('withdrawal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('withdrawal')
export class WithdrawalController {
  constructor(private withdrawal: WithdrawalService) {}

  @Get()
  async list(
    @CurrentUser() user: {id: string},
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.withdrawal.list(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
