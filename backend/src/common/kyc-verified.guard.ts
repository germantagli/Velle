import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class KycVerifiedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) return false;

    const u = await this.prisma.user.findUnique({
      where: {id: user.id},
      select: {kycStatus: true},
    });
    if (u?.kycStatus !== 'VERIFIED') {
      throw new ForbiddenException(
        'Verificación KYC requerida para esta operación',
      );
    }
    return true;
  }
}
