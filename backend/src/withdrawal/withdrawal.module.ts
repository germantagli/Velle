import {Module} from '@nestjs/common';
import {WithdrawalController} from './withdrawal.controller';
import {WithdrawalService} from './withdrawal.service';
import {PrismaModule} from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WithdrawalController],
  providers: [WithdrawalService],
  exports: [WithdrawalService],
})
export class WithdrawalModule {}
