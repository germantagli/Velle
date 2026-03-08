import {Controller, Get, Post, Body, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {ConversionService} from './conversion.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('conversion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversion')
export class ConversionController {
  constructor(private conversion: ConversionService) {}

  @Post('ves-to-usdt')
  async vesToUsdt(
    @CurrentUser() user: {id: string},
    @Body() body: {amount: number},
  ) {
    return this.conversion.vesToUsdt(user.id, body.amount);
  }

  @Post('usdt-to-ves')
  async usdtToVes(
    @CurrentUser() user: {id: string},
    @Body() body: {amount: number},
  ) {
    return this.conversion.usdtToVes(user.id, body.amount);
  }

  @Get('rate')
  async getRate() {
    return {rate: this.conversion.getVesToUsdtRate()};
  }
}
