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

  async validateUser(contact: string, password: string) {
    const normalized = this.normalizeContact(contact);
    const isEmail = this.isEmail(contact.trim());
    const user = isEmail
      ? await this.prisma.user.findUnique({where: {email: normalized}})
      : await this.prisma.user.findFirst({
          where: {phone: {contains: normalized}},
        });
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
    contact: string;
    email?: string;
    phone?: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const normalized = this.normalizeContact(dto.contact);
    const isEmail = this.isEmail(dto.contact.trim());
    const vc = await this.prisma.verificationCode.findFirst({
      where: {contact: normalized, purpose: 'REGISTER'},
    });
    if (!vc || !vc.usedAt)
      throw new BadRequestException('Verifica tu email o teléfono con el código OTP primero');
    if (new Date(vc.usedAt).getTime() < Date.now() - 15 * 60 * 1000)
      throw new BadRequestException('La verificación expiró. Solicita un nuevo código.');
    const accountEmail = isEmail ? normalized : (dto.email || '').trim().toLowerCase();
    const accountPhone = isEmail ? (dto.phone || null) : normalized;
    if (!accountEmail)
      throw new BadRequestException('Email requerido para la cuenta');
    const existingEmail = await this.prisma.user.findUnique({where: {email: accountEmail}});
    if (existingEmail) throw new ConflictException('El email ya está registrado');
    if (accountPhone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {phone: {contains: accountPhone}},
      });
      if (existingPhone) throw new ConflictException('El teléfono ya está registrado');
    }
    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: accountEmail,
        phone: accountPhone,
        passwordHash: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });
    await this.prisma.verificationCode.deleteMany({
      where: {contact: normalized, purpose: 'REGISTER'},
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

  async disableMfa(userId: string, code: string) {
    await this.verifyMfa(userId, code);
    await this.prisma.user.update({
      where: {id: userId},
      data: {mfaEnabled: false, mfaSecret: null},
    });
    return {disabled: true};
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({where: {id: userId}});
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash)))
      throw new UnauthorizedException('Contraseña actual incorrecta');
    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: {id: userId},
      data: {passwordHash: hash},
    });
    return {success: true};
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({where: {email: email.trim().toLowerCase()}});
    if (!user) {
      return {message: 'Si el email existe, recibirás un código de verificación.'};
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.passwordResetToken.deleteMany({where: {userId: user.id}});
    await this.prisma.passwordResetToken.create({
      data: {userId: user.id, code, expiresAt},
    });
    return {
      message: 'Si el email existe, recibirás un código de verificación.',
      email: user.email,
      devCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private normalizeContact(contact: string): string {
    const t = contact.trim().toLowerCase();
    if (this.isEmail(t)) return t;
    return t.replace(/\D/g, '').replace(/^58/, '') || t;
  }

  async sendOtp(contact: string, purpose: 'REGISTER' | 'LOGIN') {
    const normalized = this.normalizeContact(contact);
    const isEmail = this.isEmail(contact.trim());
    if (purpose === 'REGISTER') {
      if (isEmail) {
        const existing = await this.prisma.user.findUnique({
          where: {email: normalized},
        });
        if (existing)
          throw new ConflictException('El email ya está registrado');
      } else {
        const existing = await this.prisma.user.findFirst({
          where: {phone: {contains: normalized}},
        });
        if (existing)
          throw new ConflictException('El teléfono ya está registrado');
      }
    } else {
      const user = isEmail
        ? await this.prisma.user.findUnique({where: {email: normalized}})
        : await this.prisma.user.findFirst({
            where: {phone: {contains: normalized}},
          });
      if (!user)
        throw new BadRequestException('No existe cuenta con ese email o teléfono');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.verificationCode.deleteMany({
      where: {contact: normalized, purpose},
    });
    await this.prisma.verificationCode.create({
      data: {contact: normalized, code, purpose, expiresAt},
    });
    const devCode = process.env.NODE_ENV !== 'production' ? code : undefined;
    return {
      message: 'Código enviado. Revisa tu ' + (isEmail ? 'email' : 'SMS') + '.',
      devCode,
    };
  }

  async verifyOtpLogin(contact: string, code: string) {
    const normalized = this.normalizeContact(contact);
    const isEmail = this.isEmail(contact.trim());
    const user = isEmail
      ? await this.prisma.user.findUnique({where: {email: normalized}})
      : await this.prisma.user.findFirst({
          where: {phone: {contains: normalized}},
        });
    if (!user) throw new BadRequestException('Contacto no encontrado');
    const vc = await this.prisma.verificationCode.findFirst({
      where: {contact: normalized, code, purpose: 'LOGIN'},
    });
    if (!vc) throw new BadRequestException('Código inválido');
    if (new Date() > vc.expiresAt)
      throw new BadRequestException('El código ha expirado');
    await this.prisma.verificationCode.delete({where: {id: vc.id}});
    const tokenData = await this.login(user);
    const profile = await this.getProfile(user.id);
    return {access_token: tokenData.access_token, expires_in: tokenData.expires_in, user: profile};
  }

  async verifyOtpRegister(contact: string, code: string) {
    const normalized = this.normalizeContact(contact);
    const vc = await this.prisma.verificationCode.findFirst({
      where: {contact: normalized, code, purpose: 'REGISTER'},
    });
    if (!vc) throw new BadRequestException('Código inválido');
    if (new Date() > vc.expiresAt)
      throw new BadRequestException('El código ha expirado');
    await this.prisma.verificationCode.update({
      where: {id: vc.id},
      data: {usedAt: new Date()},
    });
    return {verified: true, contact: normalized};
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    if (newPassword.length < 6)
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    const user = await this.prisma.user.findUnique({
      where: {email: email.trim().toLowerCase()},
    });
    if (!user) throw new BadRequestException('Email o código inválido');
    const token = await this.prisma.passwordResetToken.findFirst({
      where: {userId: user.id, code},
    });
    if (!token) throw new BadRequestException('Código inválido o expirado');
    if (new Date() > token.expiresAt) {
      await this.prisma.passwordResetToken.delete({where: {id: token.id}});
      throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {id: user.id},
        data: {passwordHash: hash},
      }),
      this.prisma.passwordResetToken.delete({where: {id: token.id}}),
    ]);
    return {message: 'Contraseña actualizada correctamente'};
  }
}
