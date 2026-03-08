import {Module} from '@nestjs/common';
import {DepositController} from './deposit.controller';
import {DepositService} from './deposit.service';
import {PrismaModule} from '../prisma/prisma.module';
import {ConfigModule} from '../config/config.module';
import {ConversionModule} from '../conversion/conversion.module';

@Module({
  imports: [PrismaModule, ConfigModule, ConversionModule],
  controllers: [DepositController],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}
