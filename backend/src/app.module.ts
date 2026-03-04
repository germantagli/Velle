import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {PrismaModule} from './prisma/prisma.module';
import {AuthModule} from './auth/auth.module';
import {WalletModule} from './wallet/wallet.module';
import {ZelleModule} from './zelle/zelle.module';
import {TransferModule} from './transfer/transfer.module';
import {KycModule} from './kyc/kyc.module';
import {UserModule} from './user/user.module';
import {MerchantModule} from './merchant/merchant.module';
import {CardsModule} from './cards/cards.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    PrismaModule,
    AuthModule,
    UserModule,
    WalletModule,
    ZelleModule,
    TransferModule,
    MerchantModule,
    CardsModule,
    KycModule,
  ],
})
export class AppModule {}
