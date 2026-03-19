import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {AdminGuard} from '../common/admin.guard';
import {AdminKycService} from './admin-kyc.service';

@ApiTags('admin/kyc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/kyc')
export class AdminKycController {
  constructor(private adminKyc: AdminKycService) {}

  @Get('pending')
  async listPending() {
    return this.adminKyc.listPending();
  }

  @Get('users/:userId/documents')
  async getUserDocuments(@Param('userId') userId: string) {
    return this.adminKyc.getUserDocuments(userId);
  }

  @Post('users/:userId/approve')
  async approve(@Param('userId') userId: string) {
    return this.adminKyc.approve(userId);
  }

  @Post('users/:userId/reject')
  async reject(
    @Param('userId') userId: string,
    @Body() body: {reason?: string},
  ) {
    return this.adminKyc.reject(userId, body.reason);
  }
}
