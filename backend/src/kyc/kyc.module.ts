import {Module} from '@nestjs/common';
import {KycController} from './kyc.controller';
import {KycService} from './kyc.service';
import {SumsubService} from './sumsub.service';

@Module({
  controllers: [KycController],
  providers: [KycService, SumsubService],
  exports: [KycService],
})
export class KycModule {}
