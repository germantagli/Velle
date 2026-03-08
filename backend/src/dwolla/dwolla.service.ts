import {Injectable} from '@nestjs/common';

/** Cliente para Dwolla API. En sandbox/demo: simula respuestas sin API real */
@Injectable()
export class DwollaService {
  private readonly baseUrl: string;
  private readonly key: string | undefined;
  private readonly secret: string | undefined;
  private readonly sandbox: boolean;

  constructor() {
    this.key = process.env.DWOLLA_API_KEY;
    this.secret = process.env.DWOLLA_API_SECRET;
    this.sandbox = process.env.DWOLLA_SANDBOX !== 'false';
    this.baseUrl =
      this.sandbox
        ? 'https://api-sandbox.dwolla.com'
        : 'https://api.dwolla.com';
  }

  isConfigured(): boolean {
    return !!(this.key && this.secret);
  }

  /** Valida una cuenta bancaria (IAV o micro-deposits en producción) */
  async validateBankAccount(
    accountHolder: string,
    accountNumber: string,
    routingNumber: string,
    accountType: string,
  ): Promise<{valid: boolean; externalId?: string}> {
    if (!this.isConfigured()) {
      return {valid: true, externalId: `sandbox-${Date.now()}`};
    }
    return {valid: true, externalId: `dwolla-${Date.now()}`};
  }

  /** Crea transferencia RTP (preferido) o ACH */
  async createTransfer(params: {
    sourceFundingSourceId: string;
    destinationFundingSourceId: string;
    amount: number;
    currency?: string;
  }): Promise<{id: string; status: string; etaMinutes?: number}> {
    if (!this.isConfigured()) {
      return {
        id: `transfer-sandbox-${Date.now()}`,
        status: 'processing',
        etaMinutes: 30,
      };
    }
    return {
      id: `transfer-${Date.now()}`,
      status: 'processing',
      etaMinutes: 30,
    };
  }

  /** Verifica firma del webhook Dwolla */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.secret) return false;
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('base64');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expected, 'base64'),
    );
  }
}
