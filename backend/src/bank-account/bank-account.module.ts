import {Module} from '@nestjs/common';
import {BankAccountController} from './bank-account.controller';
import {BankAccountService} from './bank-account.service';
import {PrismaModule} from '../prisma/prisma.module';
import {DwollaModule} from '../dwolla/dwolla.module';

@Module({
  imports: [PrismaModule, DwollaModule],
  controllers: [BankAccountController],
  providers: [BankAccountService],
  exports: [BankAccountService],
})
export class BankAccountModule {}
