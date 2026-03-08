import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_GUARD} from '@nestjs/core';
import {ThrottlerModule, ThrottlerGuard} from '@nestjs/throttler';
import {PrismaModule} from './prisma/prisma.module';
import {AuthModule} from './auth/auth.module';
import {WalletModule} from './wallet/wallet.module';
import {ZelleModule} from './zelle/zelle.module';
import {TransferModule} from './transfer/transfer.module';
import {KycModule} from './kyc/kyc.module';
import {UserModule} from './user/user.module';
import {MerchantModule} from './merchant/merchant.module';
import {CardsModule} from './cards/cards.module';
import {DepositModule} from './deposit/deposit.module';
import {ConversionModule} from './conversion/conversion.module';
import {WithdrawalModule} from './withdrawal/withdrawal.module';
import {ConfigModule} from './config/config.module';
import {LimitsModule} from './limits/limits.module';
import {BankAccountModule} from './bank-account/bank-account.module';
import {DwollaModule} from './dwolla/dwolla.module';
import {WithdrawalUsaModule} from './withdrawal-usa/withdrawal-usa.module';
import {WebhooksModule} from './webhooks/webhooks.module';
import {AppController} from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    ThrottlerModule.forRoot([{ttl: 60000, limit: 100}]),
    PrismaModule,
    AuthModule,
    UserModule,
    WalletModule,
    ZelleModule,
    TransferModule,
    MerchantModule,
    CardsModule,
    KycModule,
    DepositModule,
    ConversionModule,
    WithdrawalModule,
    ConfigModule,
    LimitsModule,
    BankAccountModule,
    DwollaModule,
    WithdrawalUsaModule,
    WebhooksModule,
  ],
  providers: [
    {provide: APP_GUARD, useClass: ThrottlerGuard},
  ],
})
export class AppModule {}
