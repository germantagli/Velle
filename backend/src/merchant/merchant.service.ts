import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  async getByQr(qrCode: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: {
        OR: [{qrCode: qrCode}, {id: qrCode}],
        status: 'active',
      },
    });
    if (!merchant) throw new NotFoundException('Comercio no encontrado');
    return {
      id: merchant.id,
      name: merchant.name,
      documentId: merchant.documentId,
    };
  }
}
