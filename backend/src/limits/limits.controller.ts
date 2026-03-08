import {Controller, Get, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {LimitsService} from './limits.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('limits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('limits')
export class LimitsController {
  constructor(private limits: LimitsService) {}

  @Get()
  async getRemaining(@CurrentUser() user: {id: string}) {
    return this.limits.getRemaining(user.id);
  }
}
