import {Module} from '@nestjs/common';
import {NotificationModule} from '../notification/notification.module';
import {TransferController} from './transfer.controller';
import {TransferService} from './transfer.service';
import {WalletModule} from '../wallet/wallet.module';

@Module({
  imports: [WalletModule, NotificationModule],
  controllers: [TransferController],
  providers: [TransferService],
})
export class TransferModule {}
