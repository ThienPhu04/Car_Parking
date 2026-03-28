import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Loading } from '../../../shared/components/Loading';
import { COLORS } from '../../../shared/constants/colors';
import { CONFIG } from '../../../shared/constants/config';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { formatters } from '../../../shared/utils/formatters';
import { MainStackParamList } from '../../../types/navigation.types';
import { Booking } from '../../../types/booking.types';
import { useAuth } from '../../../store/AuthContext';
import { bookingService } from '../services/bookingService';
import { CountdownTimer } from '../components/CountdownTimer';
import { normalizeBookingList } from '../utils/bookingAdapters';

type BookingConfirmRouteProp = RouteProp<MainStackParamList, 'BookingConfirm'>;

const buildHoldExpiryTime = (booking: Booking) => {
  const createdAt = new Date(booking.createdAt || Date.now());
  const createdAtMs = Number.isNaN(createdAt.getTime()) ? Date.now() : createdAt.getTime();

  return new Date(
    createdAtMs + CONFIG.BOOKING_TIMEOUT_MINUTES * 60 * 1000,
  );
};

const BookingConfirmScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookingConfirmRouteProp>();
  const { user } = useAuth();
  const { bookingId, booking: initialBooking } = route.params;

  const [booking, setBooking] = useState<Booking | null>(initialBooking ?? null);
  const [isLoading, setIsLoading] = useState(!initialBooking);

  const loadBooking = useCallback(async () => {
    try {
      if (!user?.code) {
        throw new Error('Khong tim thay thong tin nguoi dung');
      }

      setIsLoading(true);
      const response = await bookingService.getBookings({ userId: user.code });
      const bookings = normalizeBookingList(response.data);
      const matchedBooking =
        bookings.find(item => item.id === bookingId || item.code === bookingId) ?? null;

      setBooking(matchedBooking);
    } catch (error: any) {
      Alert.alert('Loi', error?.message || 'Khong the tai thong tin dat cho');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, user?.code]);

  useEffect(() => {
    if (initialBooking) {
      setBooking(initialBooking);
      setIsLoading(false);
      return;
    }

    loadBooking();
  }, [initialBooking, loadBooking]);

  const handleCancel = () => {
    Alert.alert(
      'Thong bao',
      'Chuc nang huy dat cho chua duoc ket noi voi backend hien tai.',
    );
  };

  const handleTimeout = () => {
    Alert.alert(
      'Thong bao',
      'Thoi gian giu cho da het. Vui long kiem tra lai trang thai dat cho.',
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  if (isLoading) {
    return <Loading fullscreen text="Dang tai thong tin dat cho..." />;
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Khong tim thay thong tin dat cho</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successIcon}>
          <Icon name="checkmark-circle" size={80} color={COLORS.success} />
        </View>

        <Text style={styles.title}>Dat cho thanh cong</Text>
        <Text style={styles.subtitle}>
          Ban hay den dung gio de nhan vi tri da dat.
        </Text>

        <CountdownTimer
          endTime={buildHoldExpiryTime(booking)}
          onTimeout={handleTimeout}
        />

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="location" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vi tri</Text>
              <Text style={styles.infoValue}>
                {booking.slot?.code || booking.slotId}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="car" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phuong tien</Text>
              <Text style={styles.infoValue}>
                {booking.vehicle?.licensePlate || booking.licensePlate || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="time" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thoi gian</Text>
              <Text style={styles.infoValue}>
                {formatters.dateTime(booking.startTime)}
                {booking.endTime ? ` - ${formatters.time(booking.endTime)}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="information-circle" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Trang thai</Text>
              <Text style={styles.infoValue}>
                {booking.statusName || booking.status}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.qrCard}>
          <Text style={styles.qrTitle}>Ma QR Check-in</Text>
          <View style={styles.qrPlaceholder}>
            <Icon name="qr-code" size={120} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.qrSubtitle}>
            Backend hien tai chua tra ve QR code, day la khung cho san.
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Xem lich su dat cho"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Huy dat cho"
            onPress={handleCancel}
            variant="text"
            style={styles.actionButton}
          />
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
    padding: SPACING.xl,
    alignItems: 'center',
  },
  successIcon: {
    marginVertical: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  infoCard: {
    width: '100%',
    marginVertical: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  qrCard: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  qrTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  qrSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: SPACING.lg,
  },
  actionButton: {
    marginBottom: SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});

export default BookingConfirmScreen;
