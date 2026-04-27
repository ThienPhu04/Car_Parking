import React, { useCallback, useMemo, useState } from 'react';
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

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const isGuest = !!user?.isGuest;
  const insets = useSafeAreaInsets();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const {
    wallet,
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

  const handleLogout = useCallback(() => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }, [logout]);

  const menuItems = useMemo(
    () =>
      [
        {
          key: 'settings',
          icon: 'settings-outline',
          title: 'Cài đặt ứng dụng',
          subtitle: 'Thông báo, giao diện và tùy chọn sử dụng',
          hiddenForGuest: true,
          onPress: () => (navigation as any).navigate('Settings'),
        },
        {
          key: 'vehicles',
          icon: 'car-outline',
          title: 'Quản lý xe',
          subtitle: 'Thêm và chỉnh sửa thông tin xe',
          hiddenForGuest: true,
          onPress: () => (navigation as any).navigate('VehicleManagement'),
        },
        {
          key: 'bookings',
          icon: 'calendar-outline',
          title: 'Lịch sử đặt chỗ',
          subtitle: 'Xem thông tin đặt chỗ đã tạo',
          hiddenForGuest: true,
          onPress: () => (navigation as any).navigate('MyBookings'),
        },
        {
          key: 'notifications',
          icon: 'notifications-outline',
          title: 'Thông báo',
          subtitle: 'Cài đặt thông báo và cập nhật',
          hiddenForGuest: true,
          onPress: () => (navigation as any).navigate('Notifications'),
        },
        {
          key: 'help',
          icon: 'help-circle-outline',
          title: 'Trợ giúp',
          subtitle: 'Câu hỏi thường gặp và hỗ trợ',
          onPress: () => Alert.alert('Trợ giúp', 'Email: support@smartparking.com'),
        },
        {
          key: 'policy',
          icon: 'document-text-outline',
          title: 'Điều khoản và chính sách',
          subtitle: 'Thông tin điều khoản sử dụng',
          onPress: () =>
            Alert.alert('Thông báo', 'Tính năng đang được phát triển'),
        },
        {
          key: 'logout',
          icon: 'log-out-outline',
          title: 'Đăng xuất',
          subtitle: 'Đăng xuất khỏi tài khoản hiện tại',
          onPress: handleLogout,
        },
      ].filter((item) => !(isGuest && item.hiddenForGuest)),
    [handleLogout, isGuest, navigation]
  );

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
            <Icon name="person" size={40} color="#FF9500" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.userName || user?.name || 'Nguoi dung'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          </View>
          {!isGuest ? (
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('EditProfile')}
            >
              <Icon name="create-outline" size={24} color="#FF9500" />
            </TouchableOpacity>
          ) : null}
        </Card>

        {!isGuest ? (
          <Card style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View>
                <Text style={styles.walletLabel}>So du tai khoan</Text>
                <Text style={styles.walletBalance}>
                  {formatCurrency(wallet?.balance || 0)}
                </Text>
              </View>
              <View style={styles.walletBadge}>
                <Icon name="wallet-outline" size={18} color="#FF9500" />
                <Text style={styles.walletBadgeText}>Vi Smart Parking</Text>
              </View>
            </View>

            <Button
              title="Nap tien"
              onPress={() => setShowTopUpModal(true)}
              fullWidth
              style={styles.walletAction}
            />
          </Card>
        ) : null}

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Card style={styles.menuItem}>
                <View style={styles.menuItemIcon}>
                  <Icon name={item.icon} size={24} color="#FF9500" />
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

        <Text style={styles.version}>Phien ban 1.0.0</Text>
      </ScrollView>

      {!isGuest ? (
        <WalletTopUpModal
          visible={showTopUpModal}
          loading={isSubmitting}
          creating={isCreatingTopUp}
          onClose={() => setShowTopUpModal(false)}
          onCreateDraft={createTopUpDraft}
          onConfirmSuccess={confirmTopUp}
        />
      ) : null}
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
  walletAction: {
    marginTop: SPACING.md,
    backgroundColor: '#FF9500',
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
