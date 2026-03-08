import {Module} from '@nestjs/common';
import {WithdrawalUsaController} from './withdrawal-usa.controller';
import {WithdrawalUsaService} from './withdrawal-usa.service';
import {PrismaModule} from '../prisma/prisma.module';
import {DwollaModule} from '../dwolla/dwolla.module';
import {LimitsModule} from '../limits/limits.module';

@Module({
  imports: [PrismaModule, DwollaModule, LimitsModule],
  controllers: [WithdrawalUsaController],
  providers: [WithdrawalUsaService],
  exports: [WithdrawalUsaService],
})
export class WithdrawalUsaModule {}
