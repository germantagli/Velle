export type BanescoSearchInput = {
  reference?: string;
  phone: string;
  bank: string;
  amount: number;
  date: Date;
};

export type BanescoSearchResult =
  | {
      outcome: 'MATCH';
      reconciliationRef: string;
      confidence: number;
      raw: Record<string, unknown>;
    }
  | {
      outcome: 'NOT_FOUND';
      raw: Record<string, unknown>;
    }
  | {
      outcome: 'MULTIPLE_MATCHES';
      candidates: Array<{reference?: string; amount: number}>;
      raw: Record<string, unknown>;
    }
  | {
      outcome: 'SUSPICIOUS';
      reason: string;
      raw: Record<string, unknown>;
    }
  | {
      outcome: 'TEMPORARY_ERROR';
      reason: string;
      raw: Record<string, unknown>;
    };

export interface BanescoProvider {
  searchPaymentByReference(input: BanescoSearchInput): Promise<BanescoSearchResult>;
  searchPaymentsByPhoneBankAndDate(input: BanescoSearchInput): Promise<BanescoSearchResult>;
  confirmDeposit(input: BanescoSearchInput): Promise<BanescoSearchResult>;
}
