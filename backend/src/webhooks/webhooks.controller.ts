import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {Request} from 'express';
import {WithdrawalUsaService} from '../withdrawal-usa/withdrawal-usa.service';
import {DwollaService} from '../dwolla/dwolla.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private withdrawalUsa: WithdrawalUsaService,
    private dwollaService: DwollaService,
  ) {}

  @Post('dwolla')
  async handleDwolla(
    @Req() req: Request,
    @Headers('x-request-signature-sha256') signature: string,
    @Body() body: {topic?: string; resourceId?: string},
  ) {
    if (this.dwollaService.isConfigured() && signature) {
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!this.dwollaService.verifyWebhookSignature(raw, signature)) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    if (body.topic === 'transfer_completed' && body.resourceId) {
      await this.withdrawalUsa.handleTransferCompleted(body.resourceId);
    }
    if (body.topic === 'transfer_failed' && body.resourceId) {
      await this.withdrawalUsa.handleTransferFailed(body.resourceId);
    }

    return {received: true};
  }
}
