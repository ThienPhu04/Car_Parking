import React, { useCallback, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

import { Card } from '../../../shared/components/Card';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Loading } from '../../../shared/components/Loading';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { formatters } from '../../../shared/utils/formatters';
import { useNotifications } from '../../../store/NotificationContext';
import { Notification } from '../../../types/notification.types';
import { WalletTransaction } from '../../../types/wallet.types';
import { useWallet } from '../hooks/useWallet';

const isWalletDeductionNotification = (notification: Notification) => {
  const normalizedText = [
    notification.title,
    notification.message,
    JSON.stringify(notification.data || {}),
  ]
    .join(' ')
    .toLowerCase();

  return (
    normalizedText.includes('trừ tiền')
    || normalizedText.includes('tru tien')
    || normalizedText.includes('thanh toán')
    || normalizedText.includes('thanh toan')
    || (normalizedText.includes('ví') && normalizedText.includes('trừ'))
    || (normalizedText.includes('vi') && normalizedText.includes('tru'))
    || (normalizedText.includes('wallet') && normalizedText.includes('debit'))
  );
};

const TransactionCard: React.FC<{ transaction: WalletTransaction }> = ({
  transaction,
}) => {
  const isCredit = transaction.type === 'CREDIT';

  return (
    <Card style={styles.item}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            isCredit ? styles.creditIconWrap : styles.debitIconWrap,
          ]}
        >
          <Icon
            name={isCredit ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
            size={24}
            color={isCredit ? '#FF9500' : COLORS.error}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>
            {isCredit ? 'Nạp tiền vào ví' : 'Trừ tiền từ ví'}
          </Text>
          <Text style={styles.description}>
            {transaction.description
              || (isCredit ? 'Giao dịch nạp tiền' : 'Giao dịch trừ tiền')}
          </Text>
          <Text style={styles.meta}>
            {formatters.dateTime(transaction.createdAt || new Date().toISOString())}
          </Text>
          {transaction.transactionId ? (
            <Text style={styles.meta}>Mã GD: {transaction.transactionId}</Text>
          ) : null}
        </View>
        <View style={styles.amountWrap}>
          <Text style={[styles.amount, !isCredit && styles.debitAmount]}>
            {isCredit ? '+' : '-'}
            {formatters.currency(transaction.amount || 0)}
          </Text>
          {typeof transaction.balanceAfter === 'number' ? (
            <Text style={styles.balance}>
              Số dư: {formatters.currency(transaction.balanceAfter)}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
};

const WalletHistoryScreen: React.FC = () => {
  const { history, isLoading, fetchWalletData } = useWallet();
  const {
    notifications,
    isLoading: isNotificationsLoading,
    refreshNotifications,
    markAsRead,
  } = useNotifications();

  const refreshData = useCallback(async () => {
    await Promise.all([fetchWalletData(), refreshNotifications()]);
  }, [fetchWalletData, refreshNotifications]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData]),
  );

  const walletTransactions = useMemo(
    () =>
      history
        .filter(item => item.type === 'CREDIT' || item.type === 'DEBIT')
        .sort(
          (left, right) =>
            new Date(right.createdAt || 0).getTime()
            - new Date(left.createdAt || 0).getTime(),
        ),
    [history],
  );

  const deductionNotifications = useMemo(
    () =>
      notifications
        .filter(isWalletDeductionNotification)
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime()
            - new Date(left.createdAt).getTime(),
        ),
    [notifications],
  );

  const isRefreshing = isLoading || isNotificationsLoading;

  if (
    isRefreshing
    && walletTransactions.length === 0
    && deductionNotifications.length === 0
  ) {
    return <Loading fullscreen text="Đang tải lịch sử hoạt động ví..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            tintColor={COLORS.primary}
          />
        }
      >
        {walletTransactions.length === 0 && deductionNotifications.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="Chưa có hoạt động ví"
            description="Các giao dịch nạp tiền, trừ tiền và thông báo liên quan đến ví sẽ hiển thị tại đây."
          />
        ) : (
          <>
            {walletTransactions.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Giao dịch ví</Text>
                {walletTransactions.map((transaction, index) => (
                  <TransactionCard
                    key={transaction._id || transaction.transactionId || `${index}`}
                    transaction={transaction}
                  />
                ))}
              </View>
            ) : null}

            {/* {deductionNotifications.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông báo trừ tiền</Text>
                {deductionNotifications.map(notification => (
                  <TouchableOpacity
                    key={notification.id}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <Card
                      style={[
                        styles.item,
                        !notification.isRead && styles.unreadNotification,
                      ]}
                    >
                      <View style={styles.row}>
                        <View style={[styles.iconWrap, styles.debitIconWrap]}>
                          <Icon
                            name="notifications-outline"
                            size={24}
                            color={COLORS.error}
                          />
                        </View>
                        <View style={styles.content}>
                          <View style={styles.notificationHeader}>
                            <Text style={styles.title}>{notification.title}</Text>
                            {!notification.isRead ? (
                              <View style={styles.unreadDot} />
                            ) : null}
                          </View>
                          <Text style={styles.description}>{notification.message}</Text>
                          <Text style={styles.meta}>
                            {formatters.dateTime(notification.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null} */}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  item: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  creditIconWrap: {
    backgroundColor: `${COLORS.primary}10`,
  },
  debitIconWrap: {
    backgroundColor: `${COLORS.error}12`,
  },
  content: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    flexShrink: 1,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  meta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  amountWrap: {
    marginLeft: SPACING.sm,
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
  debitAmount: {
    color: COLORS.error,
  },
  balance: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.xs,
  },
});

export default WalletHistoryScreen;
