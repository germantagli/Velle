import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Request} from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as {email?: string} | undefined;
    if (!user?.email) {
      throw new ForbiddenException('Acceso denegado');
    }

    const adminEmails = this.config
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length === 0) {
      throw new ForbiddenException('Admin no configurado (ADMIN_EMAILS vacío)');
    }

    const isAdmin = adminEmails.includes(user.email.toLowerCase());
    if (!isAdmin) {
      throw new ForbiddenException('Solo administradores pueden acceder');
    }

    return true;
  }
}
