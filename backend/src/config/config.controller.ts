import {Controller, Get, Patch, Body, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {ConfigService} from './config.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private config: ConfigService) {}

  @Get('deposit')
  async getDepositConfig() {
    const autoConvert = await this.config.getBool('auto_convert_ves_on_deposit');
    return {autoConvertVesOnDeposit: autoConvert};
  }

  @Patch('deposit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateDepositConfig(
    @Body() body: {autoConvertVesOnDeposit?: boolean},
  ) {
    if (typeof body.autoConvertVesOnDeposit === 'boolean') {
      await this.config.set('auto_convert_ves_on_deposit', body.autoConvertVesOnDeposit);
    }
    return this.getDepositConfig();
  }
}
