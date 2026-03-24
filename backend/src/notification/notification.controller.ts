import {Controller, Get, Patch, Delete, Param, Query, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';
import {NotificationService} from './notification.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private notification: NotificationService) {}

  @Get()
  async list(
    @CurrentUser() user: {id: string},
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? Math.min(parseInt(limit, 10) || 50, 100) : 50;
    return this.notification.list(user.id, limitNum);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: {id: string}) {
    return this.notification.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
  ) {
    return this.notification.markAsRead(user.id, id);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
  ) {
    return this.notification.delete(user.id, id);
  }

  @Delete()
  async deleteAll(@CurrentUser() user: {id: string}) {
    return this.notification.deleteAll(user.id);
  }
}
