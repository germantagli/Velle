import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {Request} from 'express';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiTags, ApiBearerAuth, ApiConsumes, ApiBody} from '@nestjs/swagger';
import {KycService} from './kyc.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';
import {memoryStorage} from 'multer';

const multerOpts = {
  storage: memoryStorage(),
  limits: {fileSize: 10 * 1024 * 1024},
};

@ApiTags('kyc')
@Controller('kyc')
export class KycController {
  constructor(private kyc: KycService) {}

  @Get('status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async status(@CurrentUser() user: {id: string}) {
    return this.kyc.getStatus(user.id);
  }

  /** Inicia verificación KYC automatizada con Sumsub (documentos + selfie + liveness, sin revisión humana) */
  @Post('init-verification')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async initVerification(@CurrentUser() user: {id: string}) {
    return this.kyc.initSumsubVerification(user.id);
  }

  @Post('upload/:type')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOpts))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {type: 'string', format: 'binary'},
      },
    },
  })
  async upload(
    @CurrentUser() user: {id: string},
    @Param('type') type: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    const allowed = ['id_front', 'selfie', 'proof_of_address'];
    if (!allowed.includes(type)) {
      throw new BadRequestException(`Tipo debe ser: ${allowed.join(', ')}`);
    }
    const protocol =
      req.get('x-forwarded-proto') || req.protocol || 'https';
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
    const baseUrl =
      process.env.API_BASE_URL ||
      `${protocol}://${host}`.replace(/\/$/, '');
    return this.kyc.uploadDocument(user.id, type, file, baseUrl);
  }

  @Get('documents/:id/view-url')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getDocumentViewUrl(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
  ) {
    const url = await this.kyc.getDocumentViewUrl(id, user.id);
    if (!url) throw new BadRequestException('Documento no encontrado');
    return {url};
  }

  @Post('submit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async submit(
    @CurrentUser() user: {id: string},
    @Body() body: {documents: {type: string; url: string}[]},
  ) {
    return this.kyc.submitDocuments(user.id, body.documents);
  }
}
