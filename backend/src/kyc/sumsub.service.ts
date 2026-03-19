import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as crypto from 'crypto';

const SUMSUB_BASE_URL = 'https://api.sumsub.com';
const SUMSUB_SANDBOX_URL = 'https://api.sumsub.com'; // Sumsub sandbox usa misma URL, nivel básico es gratis

export interface SumsubAccessToken {
  token: string;
  userId: string;
  applicantId?: string;
}

@Injectable()
export class SumsubService {
  private readonly appToken: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly levelName: string;
  private readonly configured: boolean;

  constructor(private config: ConfigService) {
    this.appToken = this.config.get<string>('SUMSUB_APP_TOKEN', '');
    this.secretKey = this.config.get<string>('SUMSUB_SECRET_KEY', '');
    this.baseUrl = this.config.get<string>('SUMSUB_BASE_URL', SUMSUB_BASE_URL);
    this.levelName = this.config.get<string>('SUMSUB_LEVEL_NAME', 'basic-kyc-level');
    this.configured = !!(this.appToken && this.secretKey);
  }

  isConfigured(): boolean {
    return this.configured;
  }

  private signRequest(method: string, path: string, body?: string): {ts: number; sig: string} {
    const ts = Math.floor(Date.now() / 1000);
    const sig = crypto.createHmac('sha256', this.secretKey);
    sig.update(ts + method.toUpperCase() + path);
    if (body) sig.update(body);
    return {ts, sig: sig.digest('hex')};
  }

  async createApplicantOrGetExisting(externalUserId: string): Promise<string | null> {
    if (!this.configured) return null;

    const path = `/resources/applicants?levelName=${encodeURIComponent(this.levelName)}`;
    const body = JSON.stringify({externalUserId});
    const {ts, sig} = this.signRequest('POST', path, body);

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-App-Token': this.appToken,
        'X-App-Access-Ts': String(ts),
        'X-App-Access-Sig': sig,
      },
      body,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Sumsub] createApplicant error:', res.status, err);
      return null;
    }

    const data = (await res.json()) as {id: string};
    return data.id;
  }

  async createAccessToken(externalUserId: string): Promise<SumsubAccessToken | null> {
    if (!this.configured) return null;

    const applicantId = await this.createApplicantOrGetExisting(externalUserId);
    if (!applicantId) return null;

    const path = '/resources/accessTokens/sdk';
    const body = JSON.stringify({
      userId: externalUserId,
      levelName: this.levelName,
      ttlInSecs: 1200,
    });
    const {ts, sig} = this.signRequest('POST', path, body);

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-App-Token': this.appToken,
        'X-App-Access-Ts': String(ts),
        'X-App-Access-Sig': sig,
      },
      body,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Sumsub] createAccessToken error:', res.status, err);
      return null;
    }

    const data = (await res.json()) as {token: string; userId: string};
    return {
      token: data.token,
      userId: data.userId,
      applicantId,
    };
  }
}
