import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../../../store/AuthContext';
import { useNotifications } from '../../../store/NotificationContext';
import { storage } from '../../../shared/utils/storage';
import { CONFIG } from '../../../shared/constants/config';
import {
  Wallet,
  WalletTopUpDraft,
  WalletTransaction,
} from '../../../types/wallet.types';
import { NotificationType } from '../../../types/notification.types';
import { walletService } from '../services/walletService';

const ADMIN_BANK_CODE = '970422';
const ADMIN_ACCOUNT_NUMBER = '2702868679';
const ADMIN_ACCOUNT_NAME = 'NGUYEN VAN A';
const GUEST_WALLET_KEY = CONFIG.STORAGE_KEYS.GUEST_WALLET;
const GUEST_WALLET_HISTORY_KEY = CONFIG.STORAGE_KEYS.GUEST_WALLET_HISTORY;

const toWallet = (wallet?: Partial<Wallet> | null): Wallet => ({
  _id: wallet?._id,
  userId: wallet?.userId,
  balance: Number(wallet?.balance || 0),
  createdAt: wallet?.createdAt,
  updatedAt: wallet?.updatedAt,
});

export const useWallet = () => {
  const { user } = useAuth();
  const { addNotification, refreshNotifications } = useNotifications();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTopUp, setIsCreatingTopUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (user?.isGuest) {
      const guestWallet = await storage.getItem<Wallet>(GUEST_WALLET_KEY);
      const guestHistory =
        await storage.getItem<WalletTransaction[]>(GUEST_WALLET_HISTORY_KEY);

      const nextWallet = toWallet(
        guestWallet || {
          userId: user.id || 'guest-local-user',
          balance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      const nextHistory = Array.isArray(guestHistory) ? guestHistory : [];

      setWallet(nextWallet);
      setHistory(nextHistory);

      await storage.setItem(GUEST_WALLET_KEY, nextWallet);
      await storage.setItem(GUEST_WALLET_HISTORY_KEY, nextHistory);

      return {
        wallet: nextWallet,
        history: nextHistory,
      };
    }

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
  }, [user?.code, user?.id, user?.isGuest]);

  const createTopUpDraft = useCallback(
    async (amount: number): Promise<WalletTopUpDraft> => {
      if (user?.isGuest) {
        const timestamp = new Date().toISOString();
        return {
          transactionId: `guest-topup-${Date.now()}`,
          amount,
          bankCode: ADMIN_BANK_CODE,
          bankName: 'Vi khach local',
          bankAccountNumber: ADMIN_ACCOUNT_NUMBER,
          bankAccountName: ADMIN_ACCOUNT_NAME,
          transferContent: `GUEST-${Date.now()}`,
          qrValue: `guest-wallet-topup:${amount}:${timestamp}`,
          createdAt: timestamp,
        };
      }

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
    [user?.code, user?.isGuest]
  );

  const confirmTopUp = useCallback(
    async (draft: WalletTopUpDraft) => {
      if (user?.isGuest) {
        try {
          setIsSubmitting(true);

          const currentWallet = toWallet(
            wallet || {
              userId: user.id || 'guest-local-user',
              balance: 0,
              createdAt: new Date().toISOString(),
            }
          );

          const balanceBefore = Number(currentWallet.balance || 0);
          const balanceAfter = balanceBefore + Number(draft.amount || 0);
          const now = new Date().toISOString();

          const nextWallet: Wallet = {
            ...currentWallet,
            balance: balanceAfter,
            updatedAt: now,
          };

          const nextTransaction: WalletTransaction = {
            _id: `guest-wallet-tx-${Date.now()}`,
            transactionId: draft.transactionId,
            amount: draft.amount,
            type: 'CREDIT',
            balanceBefore,
            balanceAfter,
            description: 'Nap tien vao vi khach',
            createdAt: now,
            updatedAt: now,
          };

          const nextHistory = [nextTransaction, ...history];

          setWallet(nextWallet);
          setHistory(nextHistory);

          await storage.setItem(GUEST_WALLET_KEY, nextWallet);
          await storage.setItem(GUEST_WALLET_HISTORY_KEY, nextHistory);
          return;
        } finally {
          setIsSubmitting(false);
        }
      }

      if (!user?.code) {
        throw new Error('Khong tim thay ma nguoi dung');
      }

      try {
        setIsSubmitting(true);

        await walletService.simulateTopUpWebhook({
          amount: Number(draft.amount || 0),
          content: draft.transferContent || draft.transactionId,
        });

        await fetchWalletData();
        try {
          await refreshNotifications();
        } catch (notificationError) {
          console.error(
            '[useWallet] Error refreshing notifications after top up:',
            notificationError
          );
          addNotification({
            type: NotificationType.SYSTEM,
            title: 'Nap tien thanh cong',
            message: `+${Number(draft.amount || 0).toLocaleString('vi-VN')} VND vao vi`,
            data: {
              amount: draft.amount,
              transactionId: draft.transactionId,
              paymentCode: draft.transferContent,
            },
          });
        }
      } catch (error: any) {
        console.error('[useWallet] Error confirming top up:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      addNotification,
      fetchWalletData,
      history,
      refreshNotifications,
      user?.code,
      user?.id,
      user?.isGuest,
      wallet,
    ]
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
