import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        address: true,
        kycStatus: true,
        kycSkipped: true,
        mfaEnabled: true,
        passwordSet: true,
        notificationsEnabled: true,
        createdAt: true,
      },
    });
    if (!user) return null;
    const adminEmails = (this.config.get<string>('ADMIN_EMAILS', '') || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin = user.email && adminEmails.includes(user.email.toLowerCase());
    return {
      ...user,
      isAdmin: !!isAdmin,
      mfaVerified: true,
    };
  }

  async updateProfile(
    userId: string,
    data: {firstName?: string; lastName?: string; phone?: string; address?: string},
  ) {
    return this.prisma.user.update({
      where: {id: userId},
      data: {
        ...(data.firstName !== undefined && {firstName: data.firstName}),
        ...(data.lastName !== undefined && {lastName: data.lastName}),
        ...(data.phone !== undefined && {phone: data.phone || null}),
        ...(data.address !== undefined && {address: data.address || null}),
      },
    });
  }

  async skipKyc(userId: string) {
    await this.prisma.user.update({
      where: {id: userId},
      data: {kycSkipped: true},
    });
    return {success: true};
  }

  async setNotifications(userId: string, enabled: boolean) {
    return this.prisma.user.update({
      where: {id: userId},
      data: {notificationsEnabled: enabled},
    });
  }
}
