import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../../../store/AuthContext';
import {
  Wallet,
  WalletTopUpDraft,
  WalletTransaction,
} from '../../../types/wallet.types';
import { walletService } from '../services/walletService';

const ADMIN_BANK_CODE = '970422';
const ADMIN_ACCOUNT_NUMBER = '2702868679';
const ADMIN_ACCOUNT_NAME = 'NGUYEN VAN A';
const TOP_UP_POLL_INTERVAL_MS = 3000;
const TOP_UP_POLL_ATTEMPTS = 8;

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

const isMatchingTopUp = (
  transactions: WalletTransaction[],
  draft: WalletTopUpDraft
) => {
  const draftCreatedAt = Date.parse(draft.createdAt || '');
  const transactionMatched = transactions.some(transaction => {
    const transactionCreatedAt = Date.parse(transaction.createdAt || '');

    return (
      transaction.type === 'CREDIT' &&
      Number(transaction.amount) === Number(draft.amount) &&
      (!Number.isNaN(draftCreatedAt)
        ? !Number.isNaN(transactionCreatedAt) &&
          transactionCreatedAt >= draftCreatedAt - 60_000
        : true)
    );
  });

  return transactionMatched;
};

const toWallet = (wallet?: Partial<Wallet> | null): Wallet => ({
  _id: wallet?._id,
  userId: wallet?.userId,
  balance: Number(wallet?.balance || 0),
  createdAt: wallet?.createdAt,
  updatedAt: wallet?.updatedAt,
});

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTopUp, setIsCreatingTopUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (!user?.code) {
      return {
        wallet: null,
        history: [] as WalletTransaction[],
      };
    }

    try {
      setIsLoading(true);

      const [walletResponse, historyResponse] = await Promise.all([
        walletService.getWallet({ userId: user.code }),
        walletService.getHistory({ userId: user.code }),
      ]);

      const nextWallet = toWallet(walletResponse.data);
      const nextHistory = Array.isArray(historyResponse.data)
        ? historyResponse.data
        : [];

      setWallet(nextWallet);
      setHistory(nextHistory);

      return {
        wallet: nextWallet,
        history: nextHistory,
      };
    } catch (error: any) {
      console.error('[useWallet] Error fetching wallet:', error);
      Alert.alert('Loi', error?.message || 'Khong the tai thong tin vi');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.code]);

  const createTopUpDraft = useCallback(
    async (amount: number): Promise<WalletTopUpDraft> => {
      if (!user?.code) {
        throw new Error('Khong tim thay ma nguoi dung');
      }

      try {
        setIsCreatingTopUp(true);

        const response = await walletService.createTopUpQr({
          userId: user.code,
          amount,
        });

        const transaction = response.data?.transaction;
        const qrPayment = response.data?.qrPayment;
        const transactionId =
          transaction?.paymentCode ||
          transaction?.code ||
          qrPayment?.content ||
          '';
        const qrUrl = qrPayment?.qrUrl || '';
        const qrValue =
          qrPayment?.qrValue ||
          qrPayment?.qrData ||
          qrUrl ||
          qrPayment?.content ||
          transactionId;

        if (!transactionId || !qrValue) {
          throw new Error('Backend chua tra ve du thong tin QR nap tien');
        }

        return {
          transactionId,
          amount: Number(qrPayment?.amount || transaction?.amount || amount),
          bankCode: qrPayment?.bankCode || ADMIN_BANK_CODE,
          bankName: 'Tai khoan nhan tien admin',
          bankAccountNumber:
            qrPayment?.accountNumber || ADMIN_ACCOUNT_NUMBER,
          bankAccountName: qrPayment?.accountName || ADMIN_ACCOUNT_NAME,
          transferContent: qrPayment?.content || transactionId,
          qrValue,
          qrUrl,
          expireAt: qrPayment?.expireAt,
          createdAt: transaction?.createdAt || new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('[useWallet] Error creating top up QR:', error);
        throw error;
      } finally {
        setIsCreatingTopUp(false);
      }
    },
    [user?.code]
  );

  const confirmTopUp = useCallback(
    async (draft: WalletTopUpDraft) => {
      if (!user?.code) {
        throw new Error('Khong tim thay ma nguoi dung');
      }

      try {
        setIsSubmitting(true);
        const baselineBalance = Number(wallet?.balance || 0);

        for (let attempt = 0; attempt < TOP_UP_POLL_ATTEMPTS; attempt += 1) {
          if (attempt > 0) {
            await sleep(TOP_UP_POLL_INTERVAL_MS);
          }

          const latestData = await fetchWalletData();
          const latestBalance = Number(latestData.wallet?.balance || 0);

          if (
            latestBalance > baselineBalance ||
            isMatchingTopUp(latestData.history, draft)
          ) {
            return;
          }
        }

        throw new Error(
          'He thong chua ghi nhan giao dich. Vui long doi them it phut roi thu kiem tra lai.'
        );
      } catch (error: any) {
        console.error('[useWallet] Error confirming top up:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchWalletData, user?.code, wallet?.balance]
  );

  return {
    wallet,
    history,
    isLoading,
    isCreatingTopUp,
    isSubmitting,
    fetchWalletData,
    createTopUpDraft,
    confirmTopUp,
  };
};
