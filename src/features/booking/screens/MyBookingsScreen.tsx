import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { COLORS } from '../../../shared/constants/colors';
import { useAuth } from '../../../store/AuthContext';
import { useBooking } from '../hooks/useBooking';
import { Booking, BookingStatus } from '../../../types/booking.types';
import {
  ParkingSession,
  ParkingSessionStatus,
} from '../../../types/parkingSession.types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Loading } from '../../../shared/components/Loading';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';
import { BookingCard } from '../components/BookingCard';
import { parkingSessionService } from '../services/parkingSessionService';
import { normalizeParkingSessionList } from '../utils/parkingSessionAdapters';

const mapParkingSessionToHistoryItem = (session: ParkingSession): Booking => ({
  id: `parking-session-${session.id}`,
  code: session.code || session.id,
  userId: session.userId || '',
  slotId: session.slotCode,
  slot: session.slotCode || session.slotName || session.floorLabel
    ? {
        id: session.slotCode || session.slotName || session.id,
        code: session.slotCode || '',
        name: session.slotName || '',
        floorId: '',
        floorLevel: 0,
      }
    : undefined,
  vehicleId: session.plateNumber || session.id,
  vehicle: session.plateNumber || session.vehicleName
    ? {
        id: session.plateNumber || session.id,
        licensePlate: session.plateNumber || '',
        brand: session.vehicleName || '',
      }
    : undefined,
  startTime: session.checkInTime,
  endTime: session.checkOutTime,
  status:
    session.status === ParkingSessionStatus.COMPLETED
      ? BookingStatus.COMPLETED
      : BookingStatus.ACTIVE,
  statusName: session.statusName,
  licensePlate: session.plateNumber,
  createdAt: session.createdAt || session.checkInTime,
  sourceType: 'parking_session',
  displayTitle: 'Phiên đỗ xe',
  parkingSession: session,
});

const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { bookings, isLoading, fetchBookings, cancelBooking } = useBooking();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');
  const [standaloneSessions, setStandaloneSessions] = useState<Booking[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const normalizedBookings = await fetchBookings();

      if (!user?.code) {
        setStandaloneSessions([]);
        return;
      }

      const response = await parkingSessionService.getParkingSessions({
        userCode: user.code,
      });
      const sessions = normalizeParkingSessionList(response.data);
      const bookingCodes = new Set(
        normalizedBookings
          .map(booking => booking.code)
          .filter((code): code is string => Boolean(code)),
      );

      setStandaloneSessions(
        sessions
          .filter(session => !session.bookingCode || !bookingCodes.has(session.bookingCode))
          .map(mapParkingSessionToHistoryItem),
      );
    } catch (error) {
      console.error('Error loading booking history:', error);
      setStandaloneSessions([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [fetchBookings, user?.code]);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const historyItems = [...bookings, ...standaloneSessions].sort((firstItem, secondItem) => {
    const firstTime = new Date(
      firstItem.parkingSession?.checkInTime
      || firstItem.startTime
      || firstItem.createdAt,
    ).getTime();
    const secondTime = new Date(
      secondItem.parkingSession?.checkInTime
      || secondItem.startTime
      || secondItem.createdAt,
    ).getTime();

    return secondTime - firstTime;
  });

  const filteredBookings = historyItems.filter(booking =>
    filter === 'all' ? true : booking.status === filter
  );

  const filterOptions = [
    { label: 'Tất cả', value: 'all' as const },
    { label: 'Hoạt động', value: BookingStatus.ACTIVE },
    { label: 'Hoàn thành', value: BookingStatus.COMPLETED },
    { label: 'Đã hủy', value: BookingStatus.CANCELLED },
  ];

  if ((isLoading || isLoadingHistory) && historyItems.length === 0) {
    return <Loading fullscreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử đặt chỗ</Text>
      </View>

      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              filter === option.value && styles.filterChipActive,
            ]}
            onPress={() => setFilter(option.value)}
          >
            <Text
              style={[
                styles.filterText,
                filter === option.value && styles.filterTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Chưa có đặt chỗ nào"
          description="Đặt chỗ để xem lịch sử ở đây"
          actionLabel="Đặt chỗ ngay"
          onAction={() =>
            (navigation as any).navigate('MainTabs', {
              screen: 'Booking',
            })
          }
        />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() =>
                (navigation as any).navigate('BookingConfirm' as any, {
                  bookingId: item.id,
                  booking: item,
                })
              }
              onCancel={
                item.sourceType !== 'parking_session'
                && (
                  item.status === BookingStatus.ACTIVE
                  || item.status === BookingStatus.PENDING
                )
                  ? () => cancelBooking(item.id)
                  : undefined
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  listContent: {
    padding: SPACING.md,
  },
});

export default MyBookingsScreen;
