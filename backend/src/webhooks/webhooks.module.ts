import {Module} from '@nestjs/common';
import {WebhooksController} from './webhooks.controller';
import {WithdrawalUsaModule} from '../withdrawal-usa/withdrawal-usa.module';
import {DwollaModule} from '../dwolla/dwolla.module';

@Module({
  imports: [WithdrawalUsaModule, DwollaModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
