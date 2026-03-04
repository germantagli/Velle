import {Controller, Get, Post, Body, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {KycService} from './kyc.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('kyc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private kyc: KycService) {}

  @Get('status')
  async status(@CurrentUser() user: {id: string}) {
    return this.kyc.getStatus(user.id);
  }

  @Post('submit')
  async submit(
    @CurrentUser() user: {id: string},
    @Body() body: {documents: {type: string; url: string}[]},
  ) {
    return this.kyc.submitDocuments(user.id, body.documents);
  }
}
