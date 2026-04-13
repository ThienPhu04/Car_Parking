export interface WalletUserInfo {
  _id?: string;
  name?: string;
  email?: string;
}

export interface Wallet {
  _id?: string;
  userId?: string | WalletUserInfo;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

export type WalletTransactionType = 'CREDIT' | 'DEBIT';

export interface WalletTransaction {
  _id?: string;
  walletId?: string;
  transactionId?: string;
  amount: number;
  type: WalletTransactionType;
  balanceBefore?: number;
  balanceAfter?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletTopUpDraft {
  transactionId: string;
  amount: number;
  bankCode: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  transferContent: string;
  qrValue: string;
  qrUrl?: string;
  expireAt?: string;
  createdAt: string;
}
