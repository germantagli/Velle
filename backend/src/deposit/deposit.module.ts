import {Module} from '@nestjs/common';
import {DepositController} from './deposit.controller';
import {DepositService} from './deposit.service';
import {NotificationModule} from '../notification/notification.module';
import {PrismaModule} from '../prisma/prisma.module';
import {ConfigModule} from '../config/config.module';
import {ConversionModule} from '../conversion/conversion.module';
import {BanescoMockProvider} from './providers/banesco-mock.provider';

@Module({
  imports: [PrismaModule, ConfigModule, ConversionModule, NotificationModule],
  controllers: [DepositController],
  providers: [DepositService, BanescoMockProvider],
  exports: [DepositService],
})
export class DepositModule {}
