import {Injectable} from '@nestjs/common';
import {
  BanescoProvider,
  BanescoSearchInput,
  BanescoSearchResult,
} from './banesco-provider.interface';

@Injectable()
export class BanescoMockProvider implements BanescoProvider {
  async searchPaymentByReference(input: BanescoSearchInput): Promise<BanescoSearchResult> {
    return this.simulate(input);
  }

  async searchPaymentsByPhoneBankAndDate(
    input: BanescoSearchInput,
  ): Promise<BanescoSearchResult> {
    return this.simulate(input);
  }

  async confirmDeposit(input: BanescoSearchInput): Promise<BanescoSearchResult> {
    if (input.reference) {
      return this.searchPaymentByReference(input);
    }
    return this.searchPaymentsByPhoneBankAndDate(input);
  }

  private async simulate(input: BanescoSearchInput): Promise<BanescoSearchResult> {
    const seed = this.getSeed(input);

    if (seed <= 45) {
      return {
        outcome: 'MATCH',
        reconciliationRef: `BANESCO-MOCK-${Date.now()}-${seed}`,
        confidence: 0.98,
        raw: {provider: 'banesco-mock', scenario: 'match'},
      };
    }

    if (seed <= 70) {
      return {
        outcome: 'NOT_FOUND',
        raw: {provider: 'banesco-mock', scenario: 'not_found'},
      };
    }

    if (seed <= 82) {
      return {
        outcome: 'MULTIPLE_MATCHES',
        candidates: [
          {reference: input.reference, amount: input.amount},
          {reference: input.reference ? `${input.reference}-ALT` : undefined, amount: input.amount},
        ],
        raw: {provider: 'banesco-mock', scenario: 'multiple'},
      };
    }

    if (seed <= 93) {
      return {
        outcome: 'SUSPICIOUS',
        reason: 'Monto o patrón de origen requiere revisión manual',
        raw: {provider: 'banesco-mock', scenario: 'suspicious'},
      };
    }

    return {
      outcome: 'TEMPORARY_ERROR',
      reason: 'Proveedor temporalmente no disponible',
      raw: {provider: 'banesco-mock', scenario: 'temporary_error'},
    };
  }

  private getSeed(input: BanescoSearchInput): number {
    const base = `${input.reference ?? ''}|${input.phone}|${input.bank}|${input.amount.toFixed(2)}`;
    let hash = 0;
    for (let i = 0; i < base.length; i += 1) {
      hash = (hash * 31 + base.charCodeAt(i)) % 100;
    }
    return hash;
  }
}
