import {Controller, Get, Patch, Post, Body, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {UserService} from './user.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private user: UserService) {}

  @Get('profile')
  async profile(@CurrentUser() user: {id: string}) {
    return this.user.getProfile(user.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: {id: string},
    @Body() body: {firstName?: string; lastName?: string; phone?: string},
  ) {
    return this.user.updateProfile(user.id, body);
  }

  @Post('skip-kyc')
  async skipKyc(@CurrentUser() user: {id: string}) {
    return this.user.skipKyc(user.id);
  }

  @Patch('notifications')
  async setNotifications(
    @CurrentUser() user: {id: string},
    @Body() body: {enabled: boolean},
  ) {
    return this.user.setNotifications(user.id, body.enabled);
  }
}
