import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PrismaService} from '../prisma/prisma.service';

export type NotificationType =
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'KYC_DOCUMENT_APPROVED'
  | 'KYC_DOCUMENT_REJECTED'
  | 'KYC_SUBMITTED'
  | 'TRANSACTION_P2P_SENT'
  | 'TRANSACTION_P2P_RECEIVED'
  | 'TRANSACTION_P2P_VES_SENT'
  | 'TRANSACTION_P2P_VES_RECEIVED'
  | 'TRANSACTION_DEPOSIT'
  | 'TRANSACTION_CONVERSION'
  | 'TRANSACTION_ZELLE_SENT'
  | 'TRANSACTION_ZELLE_RECEIVED'
  | 'TRANSACTION_MERCHANT_PAY'
  | 'TRANSACTION_WITHDRAWAL';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  }

  /** Crea una notificación para cada admin */
  async notifyAdmins(data: {
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }) {
    const adminEmails = (this.config.get<string>('ADMIN_EMAILS', '') || '')
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);
    if (adminEmails.length === 0) return;

    const admins = await this.prisma.user.findMany({
      where: {email: {in: adminEmails}},
      select: {id: true},
    });
    for (const admin of admins) {
      await this.create({
        userId: admin.id,
        type: data.type,
        title: data.title,
        body: data.body,
        metadata: data.metadata,
      });
    }
  }

  async list(userId: string, limit = 50) {
    const items = await this.prisma.notification.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
      take: limit,
    });
    const unreadCount = await this.prisma.notification.count({
      where: {userId, readAt: null},
    });
    return {items, unreadCount};
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: {id: notificationId, userId},
      data: {readAt: new Date()},
    });
    return {ok: true};
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {userId, readAt: null},
      data: {readAt: new Date()},
    });
    return {ok: true};
  }
}
