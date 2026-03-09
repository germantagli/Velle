import axios, {AxiosInstance, AxiosError} from 'axios';
import {useAuthStore} from '../store/authStore';
import {API_URL} from '../config';

const API_BASE_URL = API_URL;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': '1.0.0',
    'X-Platform': 'mobile',
  },
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {_retry?: boolean};
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{access_token: string; expires_in: number}>('/auth/login', {
      email,
      password,
    }),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post('/auth/register', data),
  verifyMfa: (code: string) => api.post('/auth/mfa/verify', {code}),
  setupMfa: () => api.get<{secret: string; qrCode: string}>('/auth/mfa/setup'),
  enableMfa: (code: string) => api.post('/auth/mfa/enable', {code}),
};

// User
export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: Partial<{firstName: string; lastName: string; phone: string}>) =>
    api.patch('/user/profile', data),
};

// Wallet
export const walletApi = {
  getBalance: () =>
    api.get<{
      balanceVes: string;
      balanceUsdt: string;
      balance: string;
      currency: string;
    }>('/wallet/balance'),
  getTransactions: (params?: {page?: number; limit?: number; type?: string}) =>
    api.get<{
      items: TransactionItem[];
      total: number;
      page: number;
      limit: number;
    }>('/wallet/transactions', {params}),
  getTransaction: (id: string) => api.get(`/wallet/transactions/${id}`),
};

// Deposit (VES)
export const depositApi = {
  create: (amount: number) =>
    api.post<{id: string; amount: number; reference: string; status: string; instructions: string}>(
      '/deposit',
      {amount},
    ),
  list: (params?: {page?: number; limit?: number}) =>
    api.get<{
      items: {id: string; amount: string; reference: string; status: string; createdAt: string}[];
      total: number;
      page: number;
      limit: number;
    }>('/deposit', {params}),
};

// Conversion
export const conversionApi = {
  getRate: () => api.get<{rate: number}>('/conversion/rate'),
  vesToUsdt: (amount: number) =>
    api.post<{amountVes: number; usdtReceived: number; fee: number; rate: number}>(
      '/conversion/ves-to-usdt',
      {amount},
    ),
  usdtToVes: (amount: number) =>
    api.post<{amountUsdt: number; vesReceived: number; fee: number; rate: number}>(
      '/conversion/usdt-to-ves',
      {amount},
    ),
};

// Limits
export const limitsApi = {
  get: () =>
    api.get<{
      dailyLimit: number;
      dailyUsed: number;
      dailyRemaining: number;
      monthlyLimit: number;
      monthlyUsed: number;
      monthlyRemaining: number;
    }>('/limits'),
};

// Bank accounts (USA)
export const bankAccountApi = {
  list: () =>
    api.get<
      {id: string; accountHolder: string; lastFour: string; accountType: string; bankName?: string; status: string}[]
    >('/bank-accounts'),
  create: (data: {
    accountHolder: string;
    accountNumber: string;
    routingNumber: string;
    accountType: string;
    bankName?: string;
  }) => api.post('/bank-accounts', data),
  delete: (id: string) => api.delete(`/bank-accounts/${id}`),
};

// Withdrawal USA
export const withdrawalUsaApi = {
  create: (data: {bankAccountId: string; amountUsdt: number; note?: string}) =>
    api.post<{
      id: string;
      status: string;
      amountUsdt: number;
      usdAmount: number;
      fee: number;
      etaMinutes: number;
      estimatedCompletion: string;
    }>('/withdrawal/usa', data),
  list: (params?: {page?: number; limit?: number}) =>
    api.get<{
      items: {
        id: string;
        amount: string;
        usdAmount?: string;
        fee?: string;
        status: string;
        etaMinutes?: number;
        lastFour?: string;
        accountHolder?: string;
        createdAt: string;
      }[];
      total: number;
      page: number;
      limit: number;
    }>('/withdrawal/usa', {params}),
  getOne: (id: string) => api.get(`/withdrawal/usa/${id}`),
};

// Withdrawal (retiros Zelle)
export const withdrawalApi = {
  list: (params?: {page?: number; limit?: number}) =>
    api.get<{
      items: {id: string; amount: string; status: string; destinationEmail?: string; createdAt: string}[];
      total: number;
      page: number;
      limit: number;
    }>('/withdrawal', {params}),
};

export interface TransactionItem {
  id: string;
  type: string;
  amount: string;
  fee: string;
  currency?: string;
  status: string;
  recipientId?: string;
  merchantId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Zelle
export const zelleApi = {
  requestDeposit: (amount: number, zelleEmail: string) =>
    api.post<{
      reference: string;
      amount: number;
      zelleEmail: string;
      instructions: string;
      corporateZelleEmail: string;
      expiresAt: string;
    }>('/zelle/request-deposit', {amount, zelleEmail}),
  sendToZelle: (amount: number, zelleEmail: string, note?: string) =>
    api.post<{
      status: string;
      amount: number;
      zelleEmail: string;
      id: string;
      withdrawalId?: string;
    }>('/zelle/send', {amount, zelleEmail, recipientName, note}),
};

// Transfer P2P
export const transferApi = {
  p2p: (
    recipientId: string,
    amount: number,
    note?: string,
    currency?: 'USDT' | 'VES',
  ) =>
    api.post('/transfer/p2p', {recipientId, amount, note, currency}),
  searchUser: (query: string) =>
    api.get<{users: {id: string; firstName: string; lastName: string; email: string; phone: string | null}[]}>(
      '/transfer/search-user',
      {params: {q: query}},
    ),
  merchant: (merchantId: string, amount: number, method: 'qr' | 'nfc') =>
    api.post('/transfer/merchant', {merchantId, amount, method}),
};

// Merchant
export const merchantApi = {
  getByQr: (qrCode: string) =>
    api.get<{id: string; name: string; documentId: string}>(
      `/merchant/by-qr/${qrCode}`,
    ),
};

// Virtual Card
export const cardApi = {
  list: () =>
    api.get<{cards: VirtualCard[]}>('/cards'),
  create: () =>
    api.post<VirtualCard>('/cards'),
  getDetails: (id: string) => api.get<VirtualCard>(`/cards/${id}`),
  toggleFreeze: (id: string, frozen: boolean) =>
    api.patch(`/cards/${id}/freeze`, {frozen}),
};

export interface VirtualCard {
  id: string;
  lastFour: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  frozen: boolean;
  balance: string;
}

// KYC
export const kycApi = {
  submit: (documents: {type: string; url: string}[]) =>
    api.post('/kyc/submit', {documents}),
  getStatus: () =>
    api.get<{status: string; documents: {type: string; status: string}[]}>('/kyc/status'),
  uploadDocument: (type: string, formData: FormData) =>
    api.post(`/kyc/upload/${type}`, formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    }),
};
