import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import {
  Wallet,
  WalletTransaction,
} from '../../../types/wallet.types';
import { ApiError, ApiResponse } from '../../../types/api.types';

interface WalletPayload {
  userId: string;
}

interface CreateTopUpQrPayload extends WalletPayload {
  amount: number;
}

interface SimulateTopUpWebhookPayload {
  amount: number;
  content: string;
}

interface CreateTopUpQrResponse {
  transaction?: {
    _id?: string;
    code?: string;
    paymentCode?: string;
    amount?: number;
    createdAt?: string;
  };
  qrPayment?: {
    qrUrl?: string;
    qrValue?: string;
    qrData?: string;
    accountName?: string;
    amount?: number;
    content?: string;
    bankCode?: string;
    accountNumber?: string;
    expireAt?: string;
  };
}

const isNotFoundError = (error: unknown) =>
  Boolean((error as ApiError | undefined)?.statusCode === 404);

const postWithFallback = async <T>(
  endpoints: string[],
  payload: unknown
): Promise<ApiResponse<T>> => {
  let lastError: unknown;

  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index];

    try {
      return await apiClient.post<T>(endpoint, payload);
    } catch (error) {
      lastError = error;

      const shouldTryNext =
        isNotFoundError(error) && index < endpoints.length - 1;

      if (!shouldTryNext) {
        throw error;
      }
    }
  }

  throw lastError;
};

const WALLET_ENDPOINTS = {
  getWallet: [ENDPOINTS.GET_WALLET, '/api/us/getWallet'],
  getHistory: [ENDPOINTS.GET_WALLET_HISTORY, '/api/us/getHistory'],
  createTopUpQr: [
    ENDPOINTS.CREATE_TOPUP_QR,
    '/api/us/create-qr',
    '/api/us/payment/createTopupQR',
  ],
  simulateTopUpWebhook: [
    ENDPOINTS.TOPUP_WEBHOOK,
    '/api/us/payment/webhook',
    '/api/us/webhook',
  ],
} as const;

export const walletService = {
  getWallet(payload: WalletPayload) {
    return postWithFallback<Wallet>([...WALLET_ENDPOINTS.getWallet], payload);
  },

  getHistory(payload: WalletPayload) {
    return postWithFallback<WalletTransaction[]>(
      [...WALLET_ENDPOINTS.getHistory],
      payload
    );
  },

  createTopUpQr(payload: CreateTopUpQrPayload) {
    return postWithFallback<CreateTopUpQrResponse>(
      [...WALLET_ENDPOINTS.createTopUpQr],
      payload
    );
  },

  simulateTopUpWebhook(payload: SimulateTopUpWebhookPayload) {
    return postWithFallback<unknown>(
      [...WALLET_ENDPOINTS.simulateTopUpWebhook],
      payload
    );
  },
};
