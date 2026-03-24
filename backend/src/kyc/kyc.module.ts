import {Module} from '@nestjs/common';
import {NotificationModule} from '../notification/notification.module';
import {KycController} from './kyc.controller';
import {KycService} from './kyc.service';
import {SumsubService} from './sumsub.service';

@Module({
  imports: [NotificationModule],
  controllers: [KycController],
  providers: [KycService, SumsubService],
  exports: [KycService],
})
export class KycModule {}
