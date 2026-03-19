import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {Response} from 'express';
import {ConfigService} from '@nestjs/config';
import * as crypto from 'crypto';
import {PrismaService} from '../prisma/prisma.service';
import {S3Service} from '../storage/s3.service';
import {join} from 'path';
import {existsSync, createReadStream} from 'fs';

/** Sirve documentos KYC con token de un solo uso. No requiere Bearer. */
@Controller('admin/kyc/documents')
export class AdminKycDocumentController {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private config: ConfigService,
  ) {}

  @Get(':id/serve')
  async serve(
    @Param('id') documentId: string,
    @Query('t') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      throw new BadRequestException('Token requerido');
    }
    const secret = this.config.get<string>('JWT_SECRET', 'change-in-production');
    const payload = this.verifyToken(token, secret, documentId);

    const doc = await this.prisma.kycDocument.findUnique({
      where: {id: documentId},
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');

    if (doc.url.startsWith('s3:')) {
      const key = doc.url.replace(/^s3:/, '');
      if (!this.s3.isConfigured()) {
        throw new BadRequestException('Almacenamiento S3 no configurado');
      }
      const buffer = await this.s3.getObjectBuffer(key);
      const ext = key.split('.').pop() || 'jpg';
      const contentType = this.getContentType(ext);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.send(buffer);
      return;
    }

    // URL local: /uploads/filename o full URL
    let filePath: string;
    if (doc.url.startsWith('http')) {
      const u = new URL(doc.url);
      filePath = join(process.cwd(), 'uploads', u.pathname.replace(/^\/uploads\//, ''));
    } else if (doc.url.startsWith('/uploads/')) {
      filePath = join(process.cwd(), doc.url.slice(1));
    } else {
      const filename = doc.url.split('/').pop() || doc.url;
      filePath = join(process.cwd(), 'uploads', filename);
    }

    if (!existsSync(filePath)) {
      throw new NotFoundException(
        'Archivo no encontrado. En Railway el disco es efímero; configura S3 para producción.',
      );
    }
    const ext = filePath.split('.').pop() || 'jpg';
    res.setHeader('Content-Type', this.getContentType(ext));
    res.setHeader('Cache-Control', 'private, max-age=3600');
    createReadStream(filePath).pipe(res);
  }

  private verifyToken(token: string, secret: string, docId: string): {docId: string} {
    try {
      const [dataB64, sig] = token.split('.');
      if (!dataB64 || !sig) throw new Error('formato inválido');
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(dataB64)
        .digest('base64url');
      if (sig !== expectedSig) throw new Error('firma inválida');
      const data = JSON.parse(
        Buffer.from(dataB64, 'base64url').toString('utf8'),
      );
      if (data.docId !== docId) throw new Error('documento no coincide');
      if (data.exp && Date.now() > data.exp) throw new Error('token expirado');
      return data;
    } catch {
      throw new BadRequestException('Token inválido o expirado');
    }
  }

  private getContentType(ext: string): string {
    const map: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    return map[ext.toLowerCase()] || 'application/octet-stream';
  }
}
