import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/colors';
import { Card } from '../../../shared/components/Card';
import { useAuth } from '../../../store/AuthContext';
import { useParking } from '../../../store/ParkingContext';
import { MainStackParamList } from '../../../types/navigation.types';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { slots, floors } = useParking();
  const [refreshing, setRefreshing] = useState(false);

  const stats = {
    totalSlots: 120,
    availableSlots: 45,
    occupiedSlots: 65,
    reservedSlots: 10,
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const quickActions = [
    {
      id: 1,
      icon: 'search-outline',
      label: 'Tìm chỗ',
      color: COLORS.primary,
      onPress: () => (navigation as any).navigate('ParkingMap'),
    },
    {
      id: 2,
      icon: 'calendar-outline',
      label: 'Đặt chỗ',
      color: COLORS.accent,
      onPress: () => navigation.navigate('Booking' as any),
    },
    {
      id: 3,
      icon: 'car-outline',
      label: 'Tìm xe',
      color: COLORS.success,
      onPress: () => navigation.navigate('FindCar'),
    },
    {
      id: 4,
      icon: 'notifications-outline',
      label: 'Thông báo',
      color: COLORS.error,
      onPress: () => navigation.navigate('Notifications'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('Profile' as any)}
          >
            <Icon name="person" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Icon name="checkmark-circle" size={32} color={COLORS.success} />
            <Text style={styles.statValue}>{stats.availableSlots}</Text>
            <Text style={styles.statLabel}>Chỗ trống</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="car" size={32} color={COLORS.error} />
            <Text style={styles.statValue}>{stats.occupiedSlots}</Text>
            <Text style={styles.statLabel}>Đã đỗ</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="time" size={32} color={COLORS.warning} />
            <Text style={styles.statValue}>{stats.reservedSlots}</Text>
            <Text style={styles.statLabel}>Đã đặt</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionItem}
                onPress={action.onPress}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: `${action.color}20` },
                  ]}
                >
                  <Icon name={action.icon} size={28} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="checkmark-circle" size={24} color={COLORS.success} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Đã đỗ xe tại A1-05</Text>
                <Text style={styles.activityTime}>2 giờ trước • Tầng 1</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </Card>

          <Card style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="calendar" size={24} color={COLORS.warning} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Đặt chỗ B2-12</Text>
                <Text style={styles.activityTime}>Hôm qua • 15:30</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </Card>
        </View>

        {/* Parking Map Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bản đồ bãi đỗ</Text>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('ParkingMap')}
          >
            <Card style={styles.mapPreviewCard}>
              <View style={styles.mapPreview}>
                <Icon name="map" size={48} color={COLORS.primary} />
                <Text style={styles.mapPreviewText}>
                  Xem bản đồ chi tiết
                </Text>
                <View style={styles.mapStats}>
                  <View style={styles.mapStat}>
                    <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                    <Text style={styles.mapStatText}>45 trống</Text>
                  </View>
                  <View style={styles.mapStat}>
                    <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
                    <Text style={styles.mapStatText}>65 đã đỗ</Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickActionItem: {
    width: '22%',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  activityCard: {
    marginBottom: SPACING.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  mapPreviewCard: {
    padding: SPACING.lg,
  },
  mapPreview: {
    alignItems: 'center',
  },
  mapPreviewText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  mapStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  mapStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mapStatText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default HomeScreen;