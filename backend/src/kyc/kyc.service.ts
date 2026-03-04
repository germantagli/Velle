import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {kycStatus: true},
    });
    const docs = await this.prisma.kycDocument.findMany({
      where: {userId},
      select: {type: true, status: true},
    });
    return {
      status: user?.kycStatus ?? 'PENDING',
      documents: docs.map(d => ({type: d.type, status: d.status})),
    };
  }

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
