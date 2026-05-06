import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../../../store/AuthContext';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Loading } from '../../../shared/components/Loading';
import { COLORS } from '../../../shared/constants/colors';
import { CONFIG } from '../../../shared/constants/config';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { formatters } from '../../../shared/utils/formatters';
import { Booking, BookingStatus } from '../../../types/booking.types';
import { MainStackParamList } from '../../../types/navigation.types';
import {
  ParkingPaymentStatus,
  ParkingSession,
  ParkingSessionStatus,
} from '../../../types/parkingSession.types';
import { CountdownTimer } from '../components/CountdownTimer';
import { bookingService } from '../services/bookingService';
import { normalizeBookingList } from '../utils/bookingAdapters';
import { parkingSessionService } from '../services/parkingSessionService';
import { normalizeParkingSessionList } from '../utils/parkingSessionAdapters';

type BookingConfirmRouteProp = RouteProp<MainStackParamList, 'BookingConfirm'>;

const buildHoldExpiryTime = (booking: Booking) => {
  const createdAt = new Date(booking.createdAt || Date.now());
  const createdAtMs = Number.isNaN(createdAt.getTime()) ? Date.now() : createdAt.getTime();

  return new Date(createdAtMs + CONFIG.BOOKING_TIMEOUT_MINUTES * 60 * 1000);
};

const canCancelBooking = (booking: Booking) =>
  booking.status === BookingStatus.ACTIVE || booking.status === BookingStatus.PENDING;

const buildSessionLookupDate = (booking: Booking) => {
  const bookingDate = booking.startTime || booking.createdAt;
  if (!bookingDate) {
    return undefined;
  }

  const parsedDate = new Date(bookingDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsedDate.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const findMatchingParkingSession = (
  sessions: ParkingSession[],
  booking: Booking,
) => {
  if (!sessions.length) {
    return null;
  }

  const matchedByBookingCode = booking.code
    ? sessions.find(session => session.bookingCode === booking.code)
    : undefined;

  if (matchedByBookingCode) {
    return matchedByBookingCode;
  }

  const bookingTime = new Date(booking.startTime).getTime();
  if (Number.isNaN(bookingTime)) {
    return sessions[0];
  }

  return [...sessions].sort((firstSession, secondSession) => {
    const firstDelta = Math.abs(new Date(firstSession.checkInTime).getTime() - bookingTime);
    const secondDelta = Math.abs(new Date(secondSession.checkInTime).getTime() - bookingTime);
    return firstDelta - secondDelta;
  })[0];
};

const buildParkingPaymentDescription = (session: ParkingSession | null) => {
  if (!session) {
    return 'Hệ thống sẽ cập nhật trạng thái thanh toán sau khi xe ra vào bãi.';
  }

  if (session.paymentStatus === ParkingPaymentStatus.PAID) {
    return 'Phí giữ xe đã được trừ tự động từ ví khi xe checkout.';
  }

  if (session.status === ParkingSessionStatus.ONGOING) {
    return 'Phí giữ xe sẽ được tính và trừ tự động khi hệ thống ghi nhận checkout.';
  }

  return 'Nếu ví không đủ số dư khi checkout, hệ thống sẽ tạo QR để người dùng thanh toán bổ sung.';
};

const BookingConfirmScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookingConfirmRouteProp>();
  const { user } = useAuth();
  const { bookingId, booking: initialBooking } = route.params;

  const [booking, setBooking] = useState<Booking | null>(initialBooking ?? null);
  const [isLoading, setIsLoading] = useState(!initialBooking);
  const [isCancelling, setIsCancelling] = useState(false);
  const [parkingSession, setParkingSession] = useState<ParkingSession | null>(null);
  const [isLoadingParkingSession, setIsLoadingParkingSession] = useState(false);

  const loadBooking = useCallback(async () => {
    try {
      if (!user?.code) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      setIsLoading(true);
      const response = await bookingService.getBookings({ userId: user.code });
      const bookings = normalizeBookingList(response.data);
      const matchedBooking =
        bookings.find(item => item.id === bookingId || item.code === bookingId) ?? null;

      setBooking(matchedBooking);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể tải thông tin đặt chỗ');
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

  const loadParkingSession = useCallback(async (targetBooking: Booking) => {
    if (
      !user?.code
      || targetBooking.status !== BookingStatus.COMPLETED
    ) {
      setParkingSession(null);
      return;
    }

    try {
      setIsLoadingParkingSession(true);
      const lookupDate = buildSessionLookupDate(targetBooking);
      const response = await parkingSessionService.getParkingSessions({
        userCode: user.code,
        plateNumber: targetBooking.vehicle?.licensePlate || targetBooking.licensePlate,
        fromDate: lookupDate,
        toDate: lookupDate,
      });
      const sessions = normalizeParkingSessionList(response.data);
      setParkingSession(findMatchingParkingSession(sessions, targetBooking));
    } catch (error) {
      setParkingSession(null);
    } finally {
      setIsLoadingParkingSession(false);
    }
  }, [user?.code]);

  useEffect(() => {
    if (!booking) {
      setParkingSession(null);
      return;
    }

    loadParkingSession(booking);
  }, [booking, loadParkingSession]);

  const handleCancel = async () => {
    if (!booking?.code || !user?.code) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đặt chỗ để hủy');
      return;
    }

    try {
      setIsCancelling(true);
      await bookingService.cancelBooking({
        bookingCode: booking.code,
        userCode: user.code,
      });

      setBooking(prev =>
        prev
          ? {
              ...prev,
              status: BookingStatus.CANCELLED,
              statusName: 'Đã hủy',
              slotId: undefined,
            }
          : prev,
      );

      Alert.alert('Thông báo', 'Hủy đặt chỗ thành công');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể hủy đặt chỗ');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleTimeout = () => {
    Alert.alert(
      'Thông báo',
      'Thời gian giữ chỗ đã hết. Vui lòng kiểm tra lại trạng thái đặt chỗ.',
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  if (isLoading) {
    return <Loading fullscreen text="Đang tải thông tin đặt chỗ..." />;
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Không tìm thấy thông tin đặt chỗ</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPendingAssignment = !booking.slot?.code && !booking.slotId;
  const showHoldTimer = canCancelBooking(booking);
  const showParkingSession = booking.status === BookingStatus.COMPLETED;
  const paymentStatusColor = parkingSession?.paymentStatus === ParkingPaymentStatus.PAID
    ? COLORS.success
    : COLORS.warning;
  const parkingPaymentDescription = buildParkingPaymentDescription(parkingSession);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successIcon}>
          <Icon name="checkmark-circle" size={80} color={COLORS.success} />
        </View>

        <Text style={styles.title}>
          {showParkingSession ? 'Chi tiết đặt chỗ' : 'Đặt lịch thành công'}
        </Text>
        <Text style={styles.subtitle}>
          {showParkingSession
            ? 'Thông tin phiên đỗ được gắn với lịch đặt chỗ đã hoàn thành.'
            : 'Hệ thống sẽ tự động sắp xếp slot cho bạn khi đến thời điểm phù hợp.'}
        </Text>

        {showHoldTimer && (
          <CountdownTimer
            endTime={buildHoldExpiryTime(booking)}
            onTimeout={handleTimeout}
          />
        )}

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="pricetag-outline" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Mã đặt chỗ</Text>
              <Text style={styles.infoValue}>{booking.code || booking.id}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="location-outline" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vị trí</Text>
              <Text style={styles.infoValue}>
                {booking.slot?.code || booking.slotId || 'Hệ thống sẽ tự động gán'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="car-outline" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phương tiện</Text>
              <Text style={styles.infoValue}>
                {booking.vehicle?.licensePlate || booking.licensePlate || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="time-outline" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thời gian vào bãi</Text>
              <Text style={styles.infoValue}>{formatters.dateTime(booking.startTime)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="information-circle-outline" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Trạng thái</Text>
              <Text style={styles.infoValue}>{booking.statusName || booking.status}</Text>
            </View>
          </View>
        </Card>

        {/* {isPendingAssignment && showHoldTimer && (
          // <Card style={styles.noticeCard}>
          //   <Text style={styles.noticeTitle}>Slot chưa được gán</Text>
          //   <Text style={styles.noticeText}>
          //     Theo backend mới, booking sẽ được tạo trước và slot sẽ được hệ thống tự động cấp sau.
          //   </Text>
          // </Card>
        )} */}

        {showParkingSession && (
          <Card style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông tin phiên đỗ</Text>
              {isLoadingParkingSession && (
                <ActivityIndicator color={COLORS.primary} size="small" />
              )}
            </View>

            {parkingSession ? (
              <>
                <View style={styles.infoRow}>
                  <Icon name="clipboard-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Mã phiên đỗ</Text>
                    <Text style={styles.infoValue}>
                      {parkingSession.code || parkingSession.id}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="location-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Vị trí thực tế</Text>
                    <Text style={styles.infoValue}>
                      {parkingSession.slotCode || parkingSession.slotName || 'Đang cập nhật'}
                    </Text>
                    {parkingSession.floorLabel ? (
                      <Text style={styles.infoHint}>{parkingSession.floorLabel}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="car-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Biển số</Text>
                    <Text style={styles.infoValue}>
                      {parkingSession.plateNumber || booking.vehicle?.licensePlate || booking.licensePlate || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="log-in-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Check-in</Text>
                    <Text style={styles.infoValue}>
                      {formatters.dateTime(parkingSession.checkInTime)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="log-out-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Check-out</Text>
                    <Text style={styles.infoValue}>
                      {parkingSession.checkOutTime
                        ? formatters.dateTime(parkingSession.checkOutTime)
                        : 'Chưa check-out'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="wallet-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Thanh toán</Text>
                    <Text style={[styles.infoValue, { color: paymentStatusColor }]}>
                      {parkingSession.paymentStatusName || 'Đang cập nhật'}
                    </Text>
                    <Text style={styles.infoHint}>
                      {formatters.currency(parkingSession.price || 0)}
                    </Text>
                    <Text style={styles.infoHint}>
                      {parkingPaymentDescription}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptySessionState}>
                <Icon name="document-text-outline" size={24} color={COLORS.textSecondary} />
                <Text style={styles.emptySessionText}>
                  Chưa tìm thấy thông tin phiên đỗ cho lịch đặt chỗ này.
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* {!showParkingSession && (
          <Card style={styles.qrCard}>
            <Text style={styles.qrTitle}>Mã QR Check-in</Text>
            <View style={styles.qrPlaceholder}>
              <Icon name="qr-code" size={120} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.qrSubtitle}>
              Hiện tại chưa trả về QR code.
            </Text>
          </Card>
        )} */}

        <View style={styles.actions}>
          <Button
            title="Xem lịch sử đặt chỗ"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.actionButton}
          />
          {canCancelBooking(booking) && (
            <Button
              title="Hủy đặt chỗ"
              onPress={handleCancel}
              variant="text"
              style={styles.actionButton}
              loading={isCancelling}
            />
          )}
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
    lineHeight: 22,
  },
  infoCard: {
    width: '100%',
    marginVertical: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
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
  infoHint: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  noticeCard: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  noticeTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  noticeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
  emptySessionState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  emptySessionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
