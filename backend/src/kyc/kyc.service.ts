import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async submitDocuments(
    userId: string,
    documents: {type: string; url: string}[],
  ) {
    for (const doc of documents) {
      await this.prisma.kycDocument.create({
        data: {
          userId,
          type: doc.type,
          url: doc.url,
        },
      });
    }
    await this.prisma.user.update({
      where: {id: userId},
      data: {kycStatus: 'UNDER_REVIEW'},
    });
    return {status: 'submitted'};
  }
}
