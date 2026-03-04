import {Controller, Post, Body, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {ZelleService} from './zelle.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('zelle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('zelle')
export class ZelleController {
  constructor(private zelle: ZelleService) {}

  @Post('request-deposit')
  async requestDeposit(
    @CurrentUser() user: {id: string},
    @Body() body: {amount: number; zelleEmail: string},
  ) {
    return this.zelle.requestDeposit(user.id, body.amount, body.zelleEmail);
  }

  @Post('send')
  async send(
    @CurrentUser() user: {id: string},
    @Body() body: {amount: number; zelleEmail: string},
  ) {
    return this.zelle.sendToZelle(user.id, body.amount, body.zelleEmail);
  }
}
