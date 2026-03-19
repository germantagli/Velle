import {Module} from '@nestjs/common';
import {WebhooksController} from './webhooks.controller';
import {WithdrawalUsaModule} from '../withdrawal-usa/withdrawal-usa.module';
import {DwollaModule} from '../dwolla/dwolla.module';
import {KycModule} from '../kyc/kyc.module';

@Module({
  imports: [WithdrawalUsaModule, DwollaModule, KycModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
