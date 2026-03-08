import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const config = await this.prisma.systemConfig.findUnique({
      where: {key},
    });
    return (config?.value as T) ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.prisma.systemConfig.upsert({
      where: {key},
      create: {key, value: JSON.parse(JSON.stringify(value))},
      update: {value: JSON.parse(JSON.stringify(value))},
    });
  }

  async getBool(key: string): Promise<boolean> {
    const v = await this.get<boolean>(key);
    return v === true;
  }
}
