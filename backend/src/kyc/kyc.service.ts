import {Injectable, BadRequestException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {SumsubService} from './sumsub.service';
import {S3Service} from '../storage/s3.service';

@Injectable()
export class KycService {
  constructor(
    private prisma: PrismaService,
    private sumsub: SumsubService,
    private s3: S3Service,
  ) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {kycStatus: true, sumsubApplicantId: true, kycRejectionReason: true},
    });
    const docs = await this.prisma.kycDocument.findMany({
      where: {userId},
      select: {type: true, status: true, rejectionReason: true, createdAt: true},
      orderBy: {createdAt: 'desc'},
    });
    // Por cada tipo, tomar el documento más reciente (el último subido)
    const byType = new Map<string, {status: string; rejectionReason: string | null}>();
    for (const d of docs) {
      if (!byType.has(d.type)) {
        byType.set(d.type, {
          status: d.status,
          rejectionReason: d.rejectionReason,
        });
      }
    }
    const documents = Array.from(byType.entries()).map(([type, v]) => ({
      type,
      status: v.status,
      rejectionReason: v.rejectionReason,
    }));
    return {
      status: user?.kycStatus ?? 'PENDING',
      rejectionReason: user?.kycRejectionReason ?? null,
      documents,
      sumsubConfigured: this.sumsub.isConfigured(),
    };
  }

  /** Inicia verificación KYC con Sumsub (verificación automatizada sin revisión humana) */
  async initSumsubVerification(userId: string) {
    if (!this.sumsub.isConfigured()) {
      throw new BadRequestException(
        'La verificación KYC automatizada no está configurada. Contacta al administrador.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {id: true, kycStatus: true, firstName: true, lastName: true, email: true, phone: true},
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    if (user.kycStatus === 'VERIFIED') {
      return {
        accessToken: null,
        applicantId: null,
        status: 'VERIFIED',
        message: 'Ya estás verificado',
      };
    }

    const externalUserId = `velle-${userId}`;
    const result = await this.sumsub.createAccessToken(externalUserId);
    if (!result) {
      throw new BadRequestException(
        'No se pudo iniciar la verificación. Intenta de nuevo en unos minutos.',
      );
    }

    await this.prisma.user.update({
      where: {id: userId},
      data: {sumsubApplicantId: result.applicantId},
    });

    return {
      accessToken: result.token,
      applicantId: result.applicantId,
      status: user.kycStatus,
    };
  }

  /** Webhook Sumsub: actualiza KYC cuando Sumsub resuelve la verificación */
  async handleSumsubWebhook(payload: {
    applicantId?: string;
    externalUserId?: string;
    reviewResult?: {reviewAnswer?: string; reviewRejectType?: string};
    type?: string;
  }) {
    const {applicantId, externalUserId, reviewResult, type} = payload;

    if (type === 'applicantReviewed' && reviewResult) {
      const answer = reviewResult.reviewAnswer; // GREEN = aprobado, RED = rechazado
      const status = answer === 'GREEN' ? 'VERIFIED' : 'REJECTED';

      let userId: string | null = null;
      if (externalUserId?.startsWith('velle-')) {
        userId = externalUserId.replace(/^velle-/, '');
      }
      if (!userId && applicantId) {
        const user = await this.prisma.user.findFirst({
          where: {sumsubApplicantId: applicantId},
        });
        userId = user?.id ?? null;
      }

      if (userId) {
        await this.prisma.user.update({
          where: {id: userId},
          data: {kycStatus: status},
        });
      }
    }

    return {received: true};
  }

  async uploadDocument(
    userId: string,
    type: string,
    file: Express.Multer.File,
    baseUrl: string,
  ): Promise<{url: string}> {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const key = `kyc/${userId}/${type}-${Date.now()}.${ext}`;

    if (this.s3.isConfigured()) {
      await this.s3.upload(key, file.buffer, `image/${ext}`);
      return {url: `s3:${key}`};
    }

    const filename = `kyc-${userId}-${type}-${Date.now()}.${ext}`;
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, {recursive: true});
    const destPath = path.join(uploadsDir, filename);
    await fs.writeFile(destPath, file.buffer);
    const url = `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`;
    return {url};
  }

  async getDocumentViewUrl(documentId: string, userId: string): Promise<string | null> {
    const doc = await this.prisma.kycDocument.findFirst({
      where: {id: documentId, userId},
    });
    if (!doc) return null;
    if (doc.url.startsWith('s3:')) {
      const key = doc.url.replace(/^s3:/, '');
      return this.s3.getSignedUrl(key, 3600);
    }
    return doc.url;
  }

  async submitDocuments(
    userId: string,
    documents: {type: string; url: string}[],
  ) {
    for (const {type, url} of documents) {
      // Si hay un documento RECHAZADO de este tipo, actualizarlo en lugar de crear uno nuevo
      const rejected = await this.prisma.kycDocument.findFirst({
        where: {userId, type, status: 'REJECTED'},
        orderBy: {createdAt: 'desc'},
      });
      if (rejected) {
        await this.prisma.kycDocument.update({
          where: {id: rejected.id},
          data: {
            url,
            status: 'PENDING',
            rejectionReason: null,
          },
        });
      } else {
        await this.prisma.kycDocument.create({
          data: {userId, type, url},
        });
      }
    }
    await this.prisma.user.update({
      where: {id: userId},
      data: {
        kycStatus: 'UNDER_REVIEW',
        kycRejectionReason: null, // Limpiar motivo de rechazo en reenvío
      },
    });
    return {status: 'submitted'};
  }
}
