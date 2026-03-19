import {Module} from '@nestjs/common';
import {AdminKycController} from './admin-kyc.controller';
import {AdminKycDocumentController} from './admin-kyc-document.controller';
import {AdminKycService} from './admin-kyc.service';

@Module({
  controllers: [AdminKycController, AdminKycDocumentController],
  providers: [AdminKycService],
})
export class AdminModule {}
