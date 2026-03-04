import {Controller, Get, Param, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {MerchantService} from './merchant.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';

@ApiTags('merchant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('merchant')
export class MerchantController {
  constructor(private merchant: MerchantService) {}

  @Get('by-qr/:qrCode')
  async byQr(@Param('qrCode') qrCode: string) {
    return this.merchant.getByQr(qrCode);
  }
}
