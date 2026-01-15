import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, } from '../../../shared/constants/colors';
import { useBooking } from '../hooks/useBooking';
import { BookingStatus } from '../../../types/booking.types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Loading } from '../../../shared/components/Loading';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';
import { BookingCard } from '../components/BookingCard';

const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { bookings, isLoading, fetchBookings, cancelBooking } = useBooking();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const filteredBookings = bookings.filter((booking) =>
    filter === 'all' ? true : booking.status === filter
  );

  const filterOptions = [
    { label: 'Tất cả', value: 'all' as const },
    { label: 'Hoạt động', value: BookingStatus.ACTIVE },
    { label: 'Hoàn thành', value: BookingStatus.COMPLETED },
    { label: 'Đã hủy', value: BookingStatus.CANCELLED },
  ];

  if (isLoading && bookings.length === 0) {
    return <Loading fullscreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử đặt chỗ</Text>
      </View>

      {/* Filters */}
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
          onAction={() => (navigation as any).navigate('Booking' as any)}
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
                })
              }
              onCancel={
                item.status === BookingStatus.ACTIVE
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