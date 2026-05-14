import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import QRCodeStyled from 'react-native-qrcode-styled';

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
  ParkingSessionProcessType,
  ParkingSessionStatus,
} from '../../../types/parkingSession.types';
import { useWallet } from '../../profile/hooks/useWallet';
import { CountdownTimer } from '../components/CountdownTimer';
import { bookingService } from '../services/bookingService';
import { parkingSessionService } from '../services/parkingSessionService';
import { normalizeBookingList } from '../utils/bookingAdapters';
import { normalizeParkingSessionList } from '../utils/parkingSessionAdapters';

type BookingConfirmRouteProp = RouteProp<MainStackParamList, 'BookingConfirm'>;

type ParkingPaymentQrDraft = {
  qr?: string;
  content?: string;
  amount: number;
  message?: string;
  type?: ParkingSessionProcessType;
};

const isRemoteImageUrl = (value?: string | null) =>
  typeof value === 'string'
  && /^https?:\/\//i.test(value)
  && /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(value);

const buildHoldExpiryTime = (booking: Booking) => {
  const createdAt = new Date(booking.createdAt || Date.now());
  const createdAtMs = Number.isNaN(createdAt.getTime())
    ? Date.now()
    : createdAt.getTime();

  return new Date(createdAtMs + CONFIG.BOOKING_TIMEOUT_MINUTES * 60 * 1000);
};

const canCancelBooking = (booking: Booking) =>
  booking.status === BookingStatus.ACTIVE
  || booking.status === BookingStatus.PENDING;

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
    const firstDelta = Math.abs(
      new Date(firstSession.checkInTime).getTime() - bookingTime,
    );
    const secondDelta = Math.abs(
      new Date(secondSession.checkInTime).getTime() - bookingTime,
    );
    return firstDelta - secondDelta;
  })[0];
};

const buildParkingPaymentDescription = (session: ParkingSession | null) => {
  if (!session) {
    return 'Hệ thống sẽ cập nhật trạng thái thanh toán sau khi xe ra vào bãi.';
  }

  if (session.paymentStatus === ParkingPaymentStatus.PAID) {
    return 'Phí gửi xe đã được trừ tự động từ ví khi xe checkout.';
  }

  if (session.status === ParkingSessionStatus.ONGOING) {
    return 'Phí gửi xe sẽ được tính và trừ tự động khi hệ thống ghi nhận checkout.';
  }

  return 'Nếu ví không đủ số dư khi checkout, hệ thống sẽ tạo QR để thanh toán trực tiếp phiên đỗ.';
};

const BookingConfirmScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookingConfirmRouteProp>();
  const { user } = useAuth();
  const { wallet, fetchWalletData } = useWallet();
  const { bookingId, booking: initialBooking } = route.params;
  const isStandaloneParkingSession =
    initialBooking?.sourceType === 'parking_session';

  const [booking, setBooking] = useState<Booking | null>(initialBooking ?? null);
  const [isLoading, setIsLoading] = useState(!initialBooking);
  const [isCancelling, setIsCancelling] = useState(false);
  const [parkingSession, setParkingSession] = useState<ParkingSession | null>(
    initialBooking?.parkingSession ?? null,
  );
  const [isLoadingParkingSession, setIsLoadingParkingSession] = useState(false);
  const [parkingPaymentQrDraft, setParkingPaymentQrDraft] =
    useState<ParkingPaymentQrDraft | null>(null);
  const [isCreatingParkingPaymentQr, setIsCreatingParkingPaymentQr] =
    useState(false);

  useEffect(() => {
    if (!user?.isGuest) {
      fetchWalletData().catch(error => {
        console.error('[BookingConfirmScreen] Error fetching wallet:', error);
      });
    }
  }, [fetchWalletData, user?.isGuest]);

  const loadBooking = useCallback(async () => {
    try {
      if (isStandaloneParkingSession && initialBooking) {
        setBooking(initialBooking);
        return;
      }

      if (!user?.code) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      setIsLoading(true);
      const response = await bookingService.getBookings({ userId: user.code });
      const bookings = normalizeBookingList(response.data);
      const matchedBooking =
        bookings.find(item => item.id === bookingId || item.code === bookingId)
        ?? null;

      setBooking(matchedBooking);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể tải thông tin đặt chỗ');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, initialBooking, isStandaloneParkingSession, user?.code]);

  useEffect(() => {
    if (initialBooking) {
      setBooking(initialBooking);
      setParkingSession(initialBooking.parkingSession ?? null);
      setIsLoading(false);
      return;
    }

    loadBooking();
  }, [initialBooking, loadBooking]);

  const loadParkingSession = useCallback(
    async (targetBooking: Booking) => {
      if (targetBooking.sourceType === 'parking_session') {
        setParkingSession(targetBooking.parkingSession ?? null);
        return;
      }

      if (!user?.code || targetBooking.status !== BookingStatus.COMPLETED) {
        setParkingSession(null);
        return;
      }

      try {
        setIsLoadingParkingSession(true);
        const lookupDate = buildSessionLookupDate(targetBooking);
        const response = await parkingSessionService.getParkingSessions({
          userCode: user.code,
          plateNumber:
            targetBooking.vehicle?.licensePlate || targetBooking.licensePlate,
          fromDate: lookupDate,
          toDate: lookupDate,
        });
        const sessions = normalizeParkingSessionList(response.data);
        setParkingSession(findMatchingParkingSession(sessions, targetBooking));
      } catch {
        setParkingSession(null);
      } finally {
        setIsLoadingParkingSession(false);
      }
    },
    [user?.code],
  );

  useEffect(() => {
    if (!booking) {
      setParkingSession(null);
      return;
    }

    loadParkingSession(booking);
  }, [booking, loadParkingSession]);

  const handleCancel = async () => {
    if (
      !booking?.code
      || !user?.code
      || booking.sourceType === 'parking_session'
    ) {
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

  const sessionDetail = booking?.parkingSession ?? parkingSession;
  const showHoldTimer =
    !!booking
    && booking.sourceType !== 'parking_session'
    && canCancelBooking(booking);
  const showParkingSession =
    booking?.sourceType === 'parking_session'
    || booking?.status === BookingStatus.COMPLETED;
  const showLinkedParkingSessionCard =
    !!booking
    && booking.sourceType !== 'parking_session'
    && showParkingSession;
  const paymentStatusColor =
    sessionDetail?.paymentStatus === ParkingPaymentStatus.PAID
      ? COLORS.success
      : COLORS.warning;
  const parkingPaymentDescription = buildParkingPaymentDescription(
    sessionDetail || null,
  );
  const isPendingAssignment =
    !!booking
    && booking.sourceType !== 'parking_session'
    && !booking.slot?.code
    && !booking.slotId;
  const sessionPrice = Number(sessionDetail?.price || 0);
  const walletBalance = Number(wallet?.balance || 0);
  const shortfallAmount = Math.max(0, sessionPrice - walletBalance);
  const shouldShowInsufficientWalletNotice = Boolean(
    !user?.isGuest
      && wallet
      && sessionDetail
      && sessionDetail.paymentStatus !== ParkingPaymentStatus.PAID
      && shortfallAmount > 0,
  );
  const parkingPaymentQrValue =
    parkingPaymentQrDraft?.qr || parkingPaymentQrDraft?.content || '';
  const shouldRenderParkingPaymentQrImage = isRemoteImageUrl(
    parkingPaymentQrDraft?.qr,
  );

  const handleCreateParkingPaymentQr = useCallback(async () => {
    if (!shouldShowInsufficientWalletNotice || !sessionDetail?.plateNumber) {
      return;
    }

    try {
      setIsCreatingParkingPaymentQr(true);
      const response = await parkingSessionService.handleParkingSession({
        plateNumber: sessionDetail.plateNumber,
      });
      const result = response.data;

      if (result.session) {
        setParkingSession(result.session);
      }

      if (result.type === 'QR_REQUIRED' && result.paymentQr) {
        setParkingPaymentQrDraft({
          qr: result.paymentQr.qr,
          content: result.paymentQr.content,
          amount: Number(result.paymentQr.amount || sessionPrice || 0),
          message: result.message,
          type: result.type,
        });
        return;
      }

      setParkingPaymentQrDraft(null);

      if (result.type === 'SUCCESS' || result.type === 'ALREADY_PAID') {
        await fetchWalletData().catch(() => undefined);
      }

      if (result.message) {
        Alert.alert('Thông báo', result.message);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể tạo mã QR thanh toán');
    } finally {
      setIsCreatingParkingPaymentQr(false);
    }
  }, [
    fetchWalletData,
    sessionDetail?.plateNumber,
    sessionPrice,
    shouldShowInsufficientWalletNotice,
  ]);

  useEffect(() => {
    if (!shouldShowInsufficientWalletNotice) {
      setParkingPaymentQrDraft(null);
      return;
    }

    if (!parkingPaymentQrDraft && !isCreatingParkingPaymentQr) {
      handleCreateParkingPaymentQr();
    }
  }, [
    handleCreateParkingPaymentQr,
    isCreatingParkingPaymentQr,
    parkingPaymentQrDraft,
    shouldShowInsufficientWalletNotice,
  ]);

  const handleRefreshParkingPaymentStatus = useCallback(async () => {
    if (!booking) {
      return;
    }

    try {
      await fetchWalletData().catch(() => undefined);
      await loadParkingSession(booking);
    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error?.message || 'Không thể cập nhật trạng thái thanh toán',
      );
    }
  }, [booking, fetchWalletData, loadParkingSession]);

  const paymentAssistContent = shouldShowInsufficientWalletNotice ? (
    <View style={styles.paymentAssistBlock}>
      <Text style={styles.paymentAssistText}>
        Số dư hiện tại không đủ để trừ tự động. Hệ thống sẽ tạo QR thanh toán
        trực tiếp cho phiên đỗ ngay bên dưới.
      </Text>
      <Text style={styles.paymentAssistText}>
        Số dư ví: {formatters.currency(walletBalance)}. Còn thiếu:{' '}
        {formatters.currency(shortfallAmount)}.
      </Text>
      {isCreatingParkingPaymentQr && !parkingPaymentQrDraft ? (
        <View style={styles.qrLoadingBlock}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.qrLoadingText}>Đang tạo mã QR thanh toán...</Text>
        </View>
      ) : null}
      {parkingPaymentQrDraft ? (
        <View style={styles.qrInlineCard}>
          {shouldRenderParkingPaymentQrImage ? (
            <Image
              source={{ uri: parkingPaymentQrDraft.qr }}
              style={styles.qrCode}
              resizeMode="contain"
            />
          ) : (
            <QRCodeStyled
              data={parkingPaymentQrValue}
              style={styles.qrCode}
              padding={18}
              pieceBorderRadius={2}
              isPiecesGlued
              color={COLORS.primaryDark}
              outerEyesOptions={{
                topLeft: { color: COLORS.primaryDark },
                topRight: { color: COLORS.primaryDark },
                bottomLeft: { color: COLORS.primaryDark },
              }}
            />
          )}
          <Text style={styles.qrAmountText}>
            Số tiền thanh toán: {formatters.currency(parkingPaymentQrDraft.amount)}
          </Text>
          {parkingPaymentQrDraft.content ? (
            <Text style={styles.qrMetaText}>
              Nội dung: {parkingPaymentQrDraft.content}
            </Text>
          ) : null}
          {parkingPaymentQrDraft.message ? (
            <Text style={styles.qrMetaText}>{parkingPaymentQrDraft.message}</Text>
          ) : null}
          <Button
            title="Làm mới trạng thái"
            onPress={handleRefreshParkingPaymentStatus}
            style={styles.paymentAssistButton}
          />
          <Button
            title="Tạo lại QR"
            onPress={handleCreateParkingPaymentQr}
            variant="outline"
            style={styles.secondaryPaymentButton}
          />
        </View>
      ) : null}
    </View>
  ) : null;

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successIcon}>
          <Icon name="checkmark-circle" size={80} color={COLORS.success} />
        </View>

        <Text style={styles.title}>
          {booking.sourceType === 'parking_session'
            ? 'Chi tiết phiên đỗ xe'
            : showParkingSession
              ? 'Chi tiết đặt chỗ'
              : 'Đặt lịch thành công'}
        </Text>
        <Text style={styles.subtitle}>
          {booking.sourceType === 'parking_session'
            ? 'Phiên đỗ này được tạo tự động khi xe vào bãi mà không có lịch đặt trước.'
            : showParkingSession
              ? 'Thông tin phiên đỗ được ghép theo lịch đặt chỗ đã hoàn thành.'
              : 'Hệ thống sẽ tự động sắp xếp slot cho bạn khi đến thời điểm phù hợp.'}
        </Text>

        {showHoldTimer ? (
          <CountdownTimer
            endTime={buildHoldExpiryTime(booking)}
            onTimeout={handleTimeout}
          />
        ) : null}

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="pricetag-outline" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {booking.sourceType === 'parking_session'
                  ? 'Mã phiên đỗ'
                  : 'Mã đặt chỗ'}
              </Text>
              <Text style={styles.infoValue}>
                {sessionDetail?.code || booking.code || booking.id}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="car-outline" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phương tiện</Text>
              <Text style={styles.infoValue}>
                {sessionDetail?.plateNumber
                  || booking.vehicle?.licensePlate
                  || booking.licensePlate
                  || 'N/A'}
              </Text>
            </View>
          </View>

          {booking.sourceType === 'parking_session' ? (
            <View style={styles.infoRow}>
              <Icon name="location-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Vị trí thực tế</Text>
                <Text style={styles.infoValue}>
                  {sessionDetail?.slotCode
                    || sessionDetail?.slotName
                    || 'Hệ thống sẽ tự động gán'}
                </Text>
                {sessionDetail?.floorLabel ? (
                  <Text style={styles.infoHint}>{sessionDetail.floorLabel}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Icon
              name={
                booking.sourceType === 'parking_session'
                  ? 'log-in-outline'
                  : 'time-outline'
              }
              size={24}
              color={COLORS.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {booking.sourceType === 'parking_session'
                  ? 'Check-in'
                  : 'Thời gian vào bãi'}
              </Text>
              <Text style={styles.infoValue}>
                {formatters.dateTime(sessionDetail?.checkInTime || booking.startTime)}
              </Text>
            </View>
          </View>

          {booking.sourceType === 'parking_session' ? (
            <View style={styles.infoRow}>
              <Icon name="log-out-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Check-out</Text>
                <Text style={styles.infoValue}>
                  {sessionDetail?.checkOutTime
                    ? formatters.dateTime(sessionDetail.checkOutTime)
                    : 'Chưa check-out'}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Icon
              name="information-circle-outline"
              size={24}
              color={COLORS.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Trạng thái</Text>
              <Text style={styles.infoValue}>
                {sessionDetail?.statusName || booking.statusName || booking.status}
              </Text>
            </View>
          </View>

          {booking.sourceType === 'parking_session' && sessionDetail ? (
            <View style={styles.infoRow}>
              <Icon name="wallet-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Thanh toán</Text>
                <Text style={[styles.infoValue, { color: paymentStatusColor }]}>
                  {sessionDetail.paymentStatusName || 'Đang cập nhật'}
                </Text>
                <Text style={styles.infoHint}>
                  {formatters.currency(sessionDetail.price || 0)}
                </Text>
                <Text style={styles.infoHint}>{parkingPaymentDescription}</Text>
                {paymentAssistContent}
              </View>
            </View>
          ) : null}
        </Card>

        {isPendingAssignment && showHoldTimer ? (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Slot chưa được gán</Text>
            <Text style={styles.noticeText}>
              Hệ thống sẽ tự động cấp vị trí khi đến thời điểm phù hợp.
            </Text>
          </Card>
        ) : null}

        {showLinkedParkingSessionCard ? (
          <Card style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông tin phiên đỗ</Text>
              {isLoadingParkingSession ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : null}
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
                  <Icon name="car-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Biển số</Text>
                    <Text style={styles.infoValue}>
                      {parkingSession.plateNumber
                        || booking.vehicle?.licensePlate
                        || booking.licensePlate
                        || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="location-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Vị trí thực tế</Text>
                    <Text style={styles.infoValue}>
                      {parkingSession.slotCode
                        || parkingSession.slotName
                        || 'Đang cập nhật'}
                    </Text>
                    {parkingSession.floorLabel ? (
                      <Text style={styles.infoHint}>{parkingSession.floorLabel}</Text>
                    ) : null}
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
                    <Text style={styles.infoHint}>{parkingPaymentDescription}</Text>
                    {paymentAssistContent}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptySessionState}>
                <Icon
                  name="document-text-outline"
                  size={24}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptySessionText}>
                  Chưa tìm thấy thông tin phiên đỗ cho lịch đặt chỗ này.
                </Text>
              </View>
            )}
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button
            title="Xem lịch sử đặt chỗ"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.actionButton}
          />
          {booking.sourceType !== 'parking_session' && canCancelBooking(booking) ? (
            <Button
              title="Hủy đặt chỗ"
              onPress={handleCancel}
              variant="text"
              style={styles.actionButton}
              loading={isCancelling}
            />
          ) : null}
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
  paymentAssistBlock: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  paymentAssistText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  qrLoadingBlock: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  qrLoadingText: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  qrInlineCard: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  qrCode: {
    width: 220,
    height: 220,
    marginBottom: SPACING.sm,
  },
  qrAmountText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  qrMetaText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  paymentAssistButton: {
    marginTop: SPACING.sm,
    alignSelf: 'stretch',
  },
  secondaryPaymentButton: {
    marginTop: SPACING.sm,
    alignSelf: 'stretch',
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
