import {Body, Controller, Get, Param, Post, Query, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {DepositStatus} from '@prisma/client';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {AdminGuard} from '../common/admin.guard';
import {CurrentUser} from '../common/current-user.decorator';
import {DepositService} from '../deposit/deposit.service';

@ApiTags('admin/deposits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/deposits')
export class AdminDepositController {
  constructor(private deposit: DepositService) {}

  @Get()
  async list(@Query('status') status?: DepositStatus) {
    return this.deposit.adminList(status);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.deposit.adminGetOne(id);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: {email?: string},
  ) {
    return this.deposit.confirm(id, {reviewedBy: user.email || 'admin'});
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: {email?: string},
    @Body() body: {reason?: string},
  ) {
    return this.deposit.reject(id, body.reason, user.email || 'admin');
  }
}
