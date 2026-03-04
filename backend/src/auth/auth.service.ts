import {Injectable} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({where: {email}});
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
    return user;
  }

  async login(user: {id: string; email: string}) {
    const payload = {sub: user.id, email: user.email};
    return {
      access_token: this.jwt.sign(payload),
      expires_in: 86400, // 24h
    };
  }

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
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
      data: {userId: user.id},
    });
    return user;
  }
}
