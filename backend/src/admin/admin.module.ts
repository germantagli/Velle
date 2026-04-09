import {Module} from '@nestjs/common';
import {NotificationModule} from '../notification/notification.module';
import {AdminKycController} from './admin-kyc.controller';
import {AdminKycDocumentController} from './admin-kyc-document.controller';
import {AdminKycService} from './admin-kyc.service';
import {DepositModule} from '../deposit/deposit.module';
import {AdminDepositController} from './admin-deposit.controller';

@Module({
  imports: [NotificationModule, DepositModule],
  controllers: [AdminKycController, AdminKycDocumentController, AdminDepositController],
  providers: [AdminKycService],
})
export class AdminModule {}
