import {PrismaClient} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: {email: 'test@velle.app'},
    update: {},
    create: {
      email: 'test@velle.app',
      passwordHash: hash,
      firstName: 'Test',
      lastName: 'Usuario',
      kycStatus: 'VERIFIED',
    },
  });
  await prisma.wallet.upsert({
    where: {userId: user.id},
    update: {},
    create: {
      userId: user.id,
      balanceUsdt: 1000,
      balanceVes: 0,
    },
  });
  await prisma.merchant.upsert({
    where: {documentId: 'MERCHANT-001'},
    update: {},
    create: {
      name: 'Tienda Demo',
      email: 'tienda@demo.com',
      documentId: 'MERCHANT-001',
      qrCode: 'MERCHANT-DEMO-001',
      status: 'active',
    },
  });

  const tier = await prisma.limitTier.upsert({
    where: {name: 'verified'},
    update: {},
    create: {
      name: 'verified',
      dailyLimitUsdt: 5000,
      monthlyLimitUsdt: 20000,
    },
  });

  await prisma.user.update({
    where: {id: user.id},
    data: {limitTierId: tier.id},
  });

  await prisma.systemConfig.upsert({
    where: {key: 'auto_convert_ves_on_deposit'},
    update: {},
    create: {
      key: 'auto_convert_ves_on_deposit',
      value: false,
    },
  });

  console.log('Seed completed');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
