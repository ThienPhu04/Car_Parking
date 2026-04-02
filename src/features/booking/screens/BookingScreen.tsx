import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Loading } from '../../../shared/components/Loading';
import { COLORS } from '../../../shared/constants/colors';
import { CONFIG } from '../../../shared/constants/config';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { formatters } from '../../../shared/utils/formatters';
import { TabParamList } from '../../../types/navigation.types';
import { useProfile } from '../../profile/hooks/useProfile';
import { TimeSelector } from '../components/TimeSelector';
import { useBooking } from '../hooks/useBooking';

type BookingScreenRouteProp = RouteProp<TabParamList, 'Booking'>;

const isValidDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const roundUpToNextHalfHour = () => {
  const now = new Date();
  const roundedDate = new Date(now);
  roundedDate.setSeconds(0, 0);

  const minutes = roundedDate.getMinutes();
  const remainder = minutes % 30;

  if (remainder !== 0) {
    roundedDate.setMinutes(minutes + (30 - remainder));
  }

  if (roundedDate.getTime() <= now.getTime()) {
    roundedDate.setMinutes(roundedDate.getMinutes() + 30);
  }

  return roundedDate;
};

const addMinutes = (date: Date, minutes: number) => {
  const nextDate = new Date(date);
  nextDate.setMinutes(nextDate.getMinutes() + minutes);
  return nextDate;
};

const buildInitialTimes = (params?: TabParamList['Booking']) => {
  const arrivalTime = isValidDate(params?.expectedArrivalTime) ?? roundUpToNextHalfHour();
  const minimumLeaveTime = addMinutes(
    arrivalTime,
    CONFIG.MIN_BOOKING_DURATION_MINUTES,
  );
  const requestedLeaveTime = isValidDate(params?.expectedLeaveTime);

  return {
    arrivalTime,
    leaveTime:
      requestedLeaveTime && requestedLeaveTime.getTime() > minimumLeaveTime.getTime()
        ? requestedLeaveTime
        : minimumLeaveTime,
  };
};

const calculateDuration = (arrivalTime: Date, leaveTime: Date) =>
  Math.round((leaveTime.getTime() - arrivalTime.getTime()) / (60 * 1000));

const BookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookingScreenRouteProp>();
  const initialTimesRef = useRef(buildInitialTimes(route.params));
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const {
    vehicles,
    fetchVehicles,
    isLoading: isLoadingVehicles,
  } = useProfile();
  const { createBooking, isLoading } = useBooking();

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(
    route.params?.vehicleId ?? null,
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    route.params?.slotId ?? null,
  );
  const [arrivalTime, setArrivalTime] = useState(initialTimesRef.current.arrivalTime);
  const [leaveTime, setLeaveTime] = useState(initialTimesRef.current.leaveTime);

  const slotId = selectedSlotId;
  const duration = calculateDuration(arrivalTime, leaveTime);

  const resetBookingForm = useCallback(() => {
    const nextInitialTimes = buildInitialTimes();
    const defaultVehicle = vehicles.find(vehicle => vehicle.isDefault) ?? vehicles[0] ?? null;

    setSelectedSlotId(null);
    setArrivalTime(nextInitialTimes.arrivalTime);
    setLeaveTime(nextInitialTimes.leaveTime);
    setSelectedVehicle(defaultVehicle?.id ?? null);
  }, [vehicles]);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles]),
  );

  useEffect(() => {
    if (vehicles.length === 0) {
      setSelectedVehicle(null);
      return;
    }

    const hasSelectedVehicle = selectedVehicle
      ? vehicles.some(vehicle => vehicle.id === selectedVehicle)
      : false;
    const defaultVehicle = vehicles.find(vehicle => vehicle.isDefault) ?? vehicles[0];

    if (!hasSelectedVehicle && defaultVehicle) {
      setSelectedVehicle(defaultVehicle.id);
    }
  }, [selectedVehicle, vehicles]);

  useEffect(() => {
    if (route.params?.vehicleId) {
      setSelectedVehicle(route.params.vehicleId);
    }
  }, [route.params?.vehicleId]);

  useEffect(() => {
    if (route.params?.slotId) {
      setSelectedSlotId(route.params.slotId);
    }
  }, [route.params?.slotId]);

  useEffect(() => {
    const nextArrivalTime = isValidDate(route.params?.expectedArrivalTime);
    const nextLeaveTime = isValidDate(route.params?.expectedLeaveTime);

    if (nextArrivalTime) {
      setArrivalTime(nextArrivalTime);
    }

    if (nextLeaveTime) {
      setLeaveTime(nextLeaveTime);
    }
  }, [route.params?.expectedArrivalTime, route.params?.expectedLeaveTime]);

  useEffect(() => {
    if (!route.params?.resetToken) {
      return;
    }

    resetBookingForm();
  }, [resetBookingForm, route.params?.resetToken]);

  const handleArrivalTimeChange = (date: Date) => {
    setArrivalTime(date);

    const minimumLeaveTime = addMinutes(date, CONFIG.MIN_BOOKING_DURATION_MINUTES);
    if (leaveTime.getTime() < minimumLeaveTime.getTime()) {
      setLeaveTime(minimumLeaveTime);
    }
  };

  const handleLeaveTimeChange = (date: Date) => {
    const minimumLeaveTime = addMinutes(
      arrivalTime,
      CONFIG.MIN_BOOKING_DURATION_MINUTES,
    );
    setLeaveTime(
      date.getTime() < minimumLeaveTime.getTime() ? minimumLeaveTime : date,
    );
  };

  const validateBookingForm = () => {
    if (!selectedVehicle) {
      Alert.alert('Loi', 'Vui long chon xe');
      return false;
    }

    if (duration < CONFIG.MIN_BOOKING_DURATION_MINUTES) {
      Alert.alert(
        'Loi',
        `Thoi gian dat cho toi thieu la ${CONFIG.MIN_BOOKING_DURATION_MINUTES} phut`,
      );
      return false;
    }

    if (duration > CONFIG.MAX_BOOKING_DURATION_HOURS * 60) {
      Alert.alert(
        'Loi',
        `Thoi gian dat cho toi da la ${CONFIG.MAX_BOOKING_DURATION_HOURS} gio`,
      );
      return false;
    }

    return true;
  };

  const openParkingMap = () => {
    if (!validateBookingForm()) {
      return;
    }

    (navigation as any).navigate('ParkingMap', {
      selectedSlot: selectedSlotId ?? undefined,
      expectedArrivalTime: arrivalTime.toISOString(),
      expectedLeaveTime: leaveTime.toISOString(),
      vehicleId: selectedVehicle,
    });
  };

  const handleBooking = async () => {
    if (!validateBookingForm()) {
      return;
    }

    if (!slotId) {
      openParkingMap();
      return;
    }

    try {
      const booking = await createBooking({
        slotId,
        vehicleId: selectedVehicle!,
        expectedArrivalTime: arrivalTime.toISOString(),
        expectedLeaveTime: leaveTime.toISOString(),
      });

      if (!booking?.id) {
        Alert.alert('Thanh cong', 'Dat cho thanh cong. Vui long kiem tra trong lich su dat cho.');
        return;
      }

      Alert.alert('Thanh cong', 'Dat cho thanh cong', [
        {
          text: 'OK',
          onPress: () =>
            (navigation as any).navigate('BookingConfirm', {
              bookingId: booking.id,
              booking,
            }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Loi', error.message || 'Khong the dat cho');
    }
  };

  if (isLoadingVehicles && vehicles.length === 0) {
    return <Loading fullscreen text="Dang tai danh sach xe..." />;
  }

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="car-outline"
          title="Chua co xe"
          description="Vui lòng thêm thông tin xe trước khi đặt chỗ"
          actionLabel="Thêm xe"
          onAction={() => (navigation as any).navigate('VehicleManagement')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + insets.bottom + 120 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Đặt chỗ đỗ xe</Text>
          <Text style={styles.subtitle}>
            Chọn xe va khung giờ trước, sau đó vào bản đồ để chọn slot phù hợp
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn xe</Text>
          {vehicles.map(vehicle => (
            <TouchableOpacity
              key={vehicle.id}
              onPress={() => setSelectedVehicle(vehicle.id)}
            >
              <Card
                style={[
                  styles.vehicleCard,
                  selectedVehicle === vehicle.id && styles.vehicleCardActive,
                ]}
              >
                <View style={styles.vehicleContent}>
                  <Icon
                    name="car-outline"
                    size={24}
                    color={
                      selectedVehicle === vehicle.id
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                    <Text style={styles.vehicleModel}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                  </View>
                  {selectedVehicle === vehicle.id && (
                    <Icon
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn thời gian</Text>
          <TimeSelector
            arrivalTime={arrivalTime}
            leaveTime={leaveTime}
            onArrivalTimeChange={handleArrivalTimeChange}
            onLeaveTimeChange={handleLeaveTimeChange}
          />
          {slotId ? (
            <Card style={styles.noticeCard}>
              <View style={styles.noticeRow}>
                <Icon name="checkmark-circle-outline" size={20} color={COLORS.success} />
                <Text style={styles.noticeText}>
                  Slot đẫ chọn sẽ được giữ lại khi bạn thay đổi thời lượng.
                </Text>
              </View>
            </Card>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vị trí đỗ xe</Text>
          {slotId ? (
            <Card>
              <View style={styles.slotInfo}>
                <Icon name="location" size={24} color={COLORS.primary} />
                <View style={styles.slotDetails}>
                  <Text style={styles.slotCode}>Slot {slotId}</Text>
                </View>
                <TouchableOpacity onPress={openParkingMap}>
                  <Text style={styles.changeText}>Đổi slot</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <Card style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>Chưa chọn slot</Text>
              <Text style={styles.placeholderText}>
                Sau khi chon thoi gian, mo ban do de xem slot phu hop va dat cho.
              </Text>
              <TouchableOpacity style={styles.inlineButton} onPress={openParkingMap}>
                <Text style={styles.inlineButtonText}>Mở bản đồ</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt thông tin</Text>
          <Card>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giờ vào</Text>
              <Text style={styles.summaryValue}>
                {formatters.dateTime(arrivalTime.toISOString())}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giờ ra</Text>
              <Text style={styles.summaryValue}>
                {formatters.dateTime(leaveTime.toISOString())}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thời lượng</Text>
              <Text style={styles.summaryValue}>{formatters.duration(duration)}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            bottom: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, SPACING.sm),
          },
        ]}
      >
        <Button
          title={slotId ? 'Xác nhận đặt chỗ' : 'Mở bản đồ chọn slot'}
          onPress={handleBooking}
          loading={isLoading}
          fullWidth
        />
      </View>
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
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  vehicleCard: {
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardActive: {
    borderColor: COLORS.primary,
  },
  vehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  vehiclePlate: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  vehicleModel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  noticeCard: {
    marginTop: SPACING.sm,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  slotCode: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  slotFloor: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  changeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  placeholderCard: {
    alignItems: 'flex-start',
  },
  placeholderTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  inlineButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inlineButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default BookingScreen;
