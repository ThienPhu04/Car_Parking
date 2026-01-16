import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../shared/constants/colors';
import { Card } from '../../../shared/components/Card';
// import { useAuth } from '../../../store/AuthContext';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  // const { user, logout } = useAuth();
  const user = { name: 'Người dùng Test', email: 'test@example.com', phone: '0909090909' };
  const logout = async () => { };

  const menuItems = [
    {
      icon: 'car-outline',
      title: 'Quản lý xe',
      subtitle: 'Thêm và chỉnh sửa thông tin xe',
      onPress: () => (navigation as any).navigate('VehicleManagement' as any),
    },
    {
      icon: 'time-outline',
      title: 'Lịch sử đỗ xe',
      subtitle: 'Xem lịch sử các lần đỗ xe',
      onPress: () => { },
    },
    {
      icon: 'notifications-outline',
      title: 'Thông báo',
      subtitle: 'Cài đặt thông báo',
      onPress: () => (navigation as any).navigate('Notifications' as any),
    },
    {
      icon: 'language-outline',
      title: 'Ngôn ngữ',
      subtitle: 'Tiếng Việt',
      onPress: () => { },
    },
    {
      icon: 'help-circle-outline',
      title: 'Trợ giúp',
      subtitle: 'Câu hỏi thường gặp',
      onPress: () => { },
    },
    {
      icon: 'document-text-outline',
      title: 'Điều khoản & Chính sách',
      subtitle: 'Điều khoản sử dụng và chính sách',
      onPress: () => { },
    },
  ];

  //   const handleLogout = () => {
  //     Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
  //       { text: 'Hủy', style: 'cancel' },
  //       {
  //         text: 'Đăng xuất',
  //         style: 'destructive',
  //         onPress: async () => {
  //           await logout();
  //         },
  //       },
  //     ]);
  //   };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Cài đặt</Text>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Icon name="person" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          </View>
          <TouchableOpacity>
            <Icon name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Card style={styles.menuItem}>
                <View style={styles.menuItemIcon}>
                  <Icon name={item.icon} size={24} color={COLORS.primary} />
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

        {/* Logout Button */}
        {/* <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity> */}

        <Text style={styles.version}>Phiên bản 1.0.0</Text>
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.error}10`,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.error,
  },
  version: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default ProfileScreen;
