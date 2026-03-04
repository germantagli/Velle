import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {PrismaModule} from './prisma/prisma.module';
import {AuthModule} from './auth/auth.module';
import {WalletModule} from './wallet/wallet.module';
import {ZelleModule} from './zelle/zelle.module';
import {TransferModule} from './transfer/transfer.module';
import {KycModule} from './kyc/kyc.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    PrismaModule,
    AuthModule,
    WalletModule,
    ZelleModule,
    TransferModule,
    KycModule,
  ],
})
export class AppModule {}
