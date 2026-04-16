import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { useAuth } from '@store/AuthContext';
import { WalletTopUpModal } from '../components/WalletTopUpModal';
import { useWallet } from '../hooks/useWallet';
import { WalletTransaction } from '../../../types/wallet.types';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const {
    wallet,
    history,
    isLoading,
    isCreatingTopUp,
    isSubmitting,
    fetchWalletData,
    createTopUpDraft,
    confirmTopUp,
  } = useWallet();

  const formatCurrency = (amount: number) =>
    `${Math.max(0, amount || 0).toLocaleString('vi-VN')} VND`;

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [fetchWalletData])
  );

  const handleLogout = () => {
    Alert.alert('Dang xuat', 'Ban co chac muon dang xuat?', [
      { text: 'Huy', style: 'cancel' },
      {
        text: 'Dang xuat',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const recentTransactions = history.slice(0, 3);

  const getTransactionMeta = (transaction: WalletTransaction) => {
    const isCredit = transaction.type === 'CREDIT';

    return {
      icon: isCredit ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline',
      color: isCredit ? COLORS.success : COLORS.warning,
      amount: `${isCredit ? '+' : '-'}${formatCurrency(transaction.amount)}`,
      title:
        transaction.description ||
        (isCredit ? 'Nap tien vao vi' : 'Thanh toan bang vi'),
    };
  };

  const menuItems = [
    {
      icon: 'settings-outline',
      title: 'Cài đặt ứng dụng',
      subtitle: 'Thông báo, giao diện và tùy chọn sử dụng',
      onPress: () => (navigation as any).navigate('Settings'),
    },
    {
      icon: 'car-outline',
      title: 'Quản lý xe',
      subtitle: 'Thêm và chỉnh sửa thông tin xe',
      onPress: () => (navigation as any).navigate('VehicleManagement'),
    },
    {
      icon: 'calendar-outline',
      title: 'Lịch sử đặt chỗ',
      subtitle: 'Xem thông tin đặt chỗ đã tạo',
      onPress: () => (navigation as any).navigate('MyBookings'),
    },
    {
      icon: 'notifications-outline',
      title: 'Thông báo',
      subtitle: 'Cài đặt thông báo và cập nhật',
      onPress: () => (navigation as any).navigate('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Trợ giúp',
      subtitle: 'Câu hỏi thường gặp và hỗ trợ',
      onPress: () => Alert.alert('Trợ giúp', 'Email: support@smartparking.com'),
    },
    {
      icon: 'document-text-outline',
      title: 'Điều khoản và chính sách',
      subtitle: 'Thông tin điều khoản sử dụng',
      onPress: () =>
        Alert.alert('Thông báo', 'Tính năng đang được phát triển'),
    },
    {
      icon: 'log-out-outline',
      title: 'Đăng xuất',
      subtitle: 'Đăng xuất khỏi tài khoản hiện tại',
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(100, insets.bottom + 88) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchWalletData}
            tintColor={COLORS.primary}
          />
        }
      >
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Icon name="person" size={40} color={"#FF9500"} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.userName || user?.name || 'Người dùng'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          </View>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('EditProfile')}
          >
            <Icon name="create-outline" size={24} color={"#FF9500"} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.walletLabel}>Số dư tài khoản</Text>
              <Text style={styles.walletBalance}>
                {formatCurrency(wallet?.balance || 0)}
              </Text>
            </View>
            <View style={styles.walletBadge}>
              <Icon name="wallet-outline" size={18} color={"#FF9500"} />
              <Text style={styles.walletBadgeText}>Ví Smart Parking</Text>
            </View>
          </View>

          <Button
            title="Nạp tiền"
            onPress={() => setShowTopUpModal(true)}
            fullWidth
            style={styles.walletAction}
          />
        </Card>
{/* History walleet */}
        {/* <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Giao dich gan day</Text>
            <TouchableOpacity onPress={fetchWalletData} activeOpacity={0.7}>
              <Text style={styles.sectionAction}>Tai lai</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => {
              const meta = getTransactionMeta(transaction);

              return (
                <Card
                  key={`${transaction.transactionId || transaction._id || index}`}
                  style={styles.transactionCard}
                >
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: `${meta.color}18` },
                    ]}
                  >
                    <Icon name={meta.icon} size={22} color={meta.color} />
                  </View>
                  <View style={styles.transactionContent}>
                    <Text style={styles.transactionTitle}>{meta.title}</Text>
                    <Text style={styles.transactionSubtitle}>
                      {transaction.transactionId || 'Khong co ma giao dich'}
                    </Text>
                  </View>
                  <Text
                    style={[styles.transactionAmount, { color: meta.color }]}
                  >
                    {meta.amount}
                  </Text>
                </Card>
              );
            })
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chua co giao dich vi</Text>
              <Text style={styles.emptySubtitle}>
                Giao dich nap tien va thanh toan bang vi se hien thi tai day.
              </Text>
            </Card>
          )}
        </View> */}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Card style={styles.menuItem}>
                <View style={styles.menuItemIcon}>
                  <Icon name={item.icon} size={24} color={"#FF9500"} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>Phiên bản 1.0.0</Text>
      </ScrollView>

      <WalletTopUpModal
        visible={showTopUpModal}
        loading={isSubmitting}
        creating={isCreatingTopUp}
        onClose={() => setShowTopUpModal(false)}
        onCreateDraft={createTopUpDraft}
        onConfirmSuccess={confirmTopUp}
      />
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
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  userPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  walletCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  walletLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  walletBalance: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  walletBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.black,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  walletHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.black,
    lineHeight: 20,
    marginTop: SPACING.md,
  },
  walletAction: {
    marginTop: SPACING.md,
    backgroundColor: "#FF9500",
  },
  transactionSection: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  sectionAction: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  transactionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  menuSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  menuItemSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  version: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default ProfileScreen;
