import {Injectable, BadRequestException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {S3Service} from '../storage/s3.service';

@Injectable()
export class AdminKycService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  async listPending() {
    const users = await this.prisma.user.findMany({
      where: {kycStatus: 'UNDER_REVIEW'},
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        kycStatus: true,
        kycRejectionReason: true,
        createdAt: true,
      },
      orderBy: {createdAt: 'desc'},
    });

    const withDocCount = await Promise.all(
      users.map(async u => {
        const count = await this.prisma.kycDocument.count({
          where: {userId: u.id},
        });
        return {...u, documentCount: count};
      }),
    );

    return {users: withDocCount};
  }

  async getUserDocuments(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        kycStatus: true,
      },
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    const docs = await this.prisma.kycDocument.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
    });

    const withViewUrls = await Promise.all(
      docs.map(async d => {
        let viewUrl = d.url;
        if (d.url.startsWith('s3:')) {
          const key = d.url.replace(/^s3:/, '');
          viewUrl = this.s3.isConfigured()
            ? await this.s3.getSignedUrl(key, 3600)
            : d.url;
        }
        const label =
          d.type === 'id_front'
            ? 'DNI / Cédula / Pasaporte'
            : d.type === 'selfie'
              ? 'Selfie con documento'
              : d.type === 'proof_of_address'
                ? 'Comprobante de domicilio'
                : d.type;
        return {
          id: d.id,
          type: d.type,
          label,
          viewUrl,
          status: d.status,
          createdAt: d.createdAt,
        };
      }),
    );

    return {user, documents: withViewUrls};
  }

  async approve(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (user.kycStatus !== 'UNDER_REVIEW') {
      throw new BadRequestException(
        `Usuario en estado ${user.kycStatus}, no UNDER_REVIEW`,
      );
    }

    await this.prisma.user.update({
      where: {id: userId},
      data: {
        kycStatus: 'VERIFIED',
        kycRejectionReason: null,
      },
    });

    await this.prisma.kycDocument.updateMany({
      where: {userId},
      data: {status: 'VERIFIED'},
    });

    return {status: 'VERIFIED', message: 'KYC aprobado'};
  }

  async reject(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (user.kycStatus !== 'UNDER_REVIEW') {
      throw new BadRequestException(
        `Usuario en estado ${user.kycStatus}, no UNDER_REVIEW`,
      );
    }

    await this.prisma.user.update({
      where: {id: userId},
      data: {
        kycStatus: 'REJECTED',
        kycRejectionReason: reason || null,
      },
    });

    await this.prisma.kycDocument.updateMany({
      where: {userId},
      data: {status: 'REJECTED', rejectionReason: reason || null},
    });

    return {status: 'REJECTED', message: 'KYC rechazado'};
  }
}
