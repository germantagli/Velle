import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class ZelleService {
  constructor(private prisma: PrismaService) {}

  // Integración con partner Zelle - implementar según proveedor
  async requestDeposit(userId: string, amount: number, zelleEmail: string) {
    // TODO: Crear solicitud de depósito, generar referencia
    // Partner Zelle recibirá y acreditará USDT en wallet
    return {
      reference: `ZELLE-${Date.now()}`,
      amount,
      zelleEmail,
      instructions: 'Enviar el monto a la cuenta corporativa Zelle indicada',
    };
  }

  async sendToZelle(userId: string, amount: number, zelleEmail: string) {
    // TODO: Validar saldo, debitar, enviar via partner
    return {status: 'pending', amount, zelleEmail};
  }
}
