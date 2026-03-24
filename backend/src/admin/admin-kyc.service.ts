import {Injectable, BadRequestException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as crypto from 'crypto';
import {PrismaService} from '../prisma/prisma.service';
import {S3Service} from '../storage/s3.service';

@Injectable()
export class AdminKycService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private config: ConfigService,
  ) {}

  async listPending() {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {kycStatus: 'UNDER_REVIEW'},
          {
            kycStatus: 'REJECTED',
            kycDocuments: {some: {status: 'PENDING'}},
          },
        ],
      },
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
          where: {
            userId: u.id,
            status: {in: ['PENDING', 'UNDER_REVIEW']},
          },
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

    const baseUrl =
      (this.config.get<string>('API_BASE_URL') || '').replace(/\/$/, '') ||
      'https://velle-developd.up.railway.app';
    const secret =
      this.config.get<string>('JWT_SECRET', 'change-in-production');

    const withViewUrls = await Promise.all(
      docs.map(async d => {
        const token = this.createServeToken(d.id, secret);
        const viewUrl = `${baseUrl}/admin/kyc/documents/${d.id}/serve?t=${token}`;
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
          rejectionReason: d.rejectionReason,
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
    if (user.kycStatus !== 'UNDER_REVIEW' && user.kycStatus !== 'REJECTED') {
      throw new BadRequestException(
        `Usuario en estado ${user.kycStatus}, debe estar en revisión`,
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
    if (user.kycStatus !== 'UNDER_REVIEW' && user.kycStatus !== 'REJECTED') {
      throw new BadRequestException(
        `Usuario en estado ${user.kycStatus}, debe estar en revisión`,
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

  /** Aprueba un documento individual. Si todos quedan aprobados, aprueba el KYC completo. */
  async approveDocument(userId: string, documentId: string) {
    const doc = await this.prisma.kycDocument.findFirst({
      where: {id: documentId, userId},
    });
    if (!doc) throw new BadRequestException('Documento no encontrado');
    if (doc.status === 'VERIFIED') {
      throw new BadRequestException('El documento ya está aprobado');
    }

    await this.prisma.kycDocument.update({
      where: {id: documentId},
      data: {status: 'VERIFIED', rejectionReason: null},
    });

    const pendingOrRejected = await this.prisma.kycDocument.count({
      where: {
        userId,
        status: {in: ['PENDING', 'UNDER_REVIEW', 'REJECTED']},
      },
    });
    if (pendingOrRejected === 0) {
      await this.prisma.user.update({
        where: {id: userId},
        data: {kycStatus: 'VERIFIED', kycRejectionReason: null},
      });
      return {status: 'VERIFIED', message: 'Documento aprobado. KYC completo aprobado.'};
    }
    return {status: 'OK', message: 'Documento aprobado'};
  }

  /** Rechaza un documento individual. El cliente solo tendrá que volver a subir ese documento. */
  async rejectDocument(userId: string, documentId: string, reason?: string) {
    const doc = await this.prisma.kycDocument.findFirst({
      where: {id: documentId, userId},
    });
    if (!doc) throw new BadRequestException('Documento no encontrado');

    await this.prisma.kycDocument.update({
      where: {id: documentId},
      data: {status: 'REJECTED', rejectionReason: reason || null},
    });

    await this.prisma.user.update({
      where: {id: userId},
      data: {
        kycStatus: 'REJECTED',
        kycRejectionReason: 'Algunos documentos requieren corrección.',
      },
    });

    return {status: 'REJECTED', message: 'Documento rechazado'};
  }

  private createServeToken(docId: string, secret: string): string {
    const exp = Date.now() + 3600 * 1000;
    const data = {docId, exp};
    const dataB64 = Buffer.from(JSON.stringify(data), 'utf8').toString(
      'base64url',
    );
    const sig = crypto.createHmac('sha256', secret).update(dataB64).digest('base64url');
    return `${dataB64}.${sig}`;
  }
}
