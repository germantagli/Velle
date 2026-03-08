import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({where: {email}});
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return null;
    return user;
  }

  async login(user: {id: string; email: string}) {
    const payload = {sub: user.id, email: user.email};
    return {
      access_token: this.jwt.sign(payload),
      expires_in: 86400,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        kycStatus: true,
        mfaEnabled: true,
      },
    });
    return user ?? null;
  }

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: {email: dto.email},
    });
    if (existing)
      throw new ConflictException('El email ya está registrado');
    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    });
    await this.prisma.wallet.create({
      data: {userId: user.id, balanceVes: 0, balanceUsdt: 0},
    });
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async setupMfa(userId: string) {
    const secret = speakeasy.generateSecret({name: 'Velle'});
    await this.prisma.user.update({
      where: {id: userId},
      data: {mfaSecret: secret.base32},
    });
    return {secret: secret.base32, qrCode: secret.otpauth_url};
  }

  async verifyMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
    });
    if (!user?.mfaSecret)
      throw new BadRequestException('MFA no configurado');
    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
    });
    if (!valid) throw new UnauthorizedException('Código inválido');
    return {verified: true};
  }

  async enableMfa(userId: string, code: string) {
    await this.verifyMfa(userId, code);
    await this.prisma.user.update({
      where: {id: userId},
      data: {mfaEnabled: true},
    });
    return {enabled: true};
  }
}
