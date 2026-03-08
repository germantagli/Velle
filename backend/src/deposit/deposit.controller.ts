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

  /** Endpoint admin: confirmar depósito (en producción usar rol admin) */
  @Post(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.deposit.confirm(id);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string) {
    return this.deposit.reject(id);
  }
}
