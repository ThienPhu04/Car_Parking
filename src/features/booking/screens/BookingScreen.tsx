import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Loading } from '../../../shared/components/Loading';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { formatters } from '../../../shared/utils/formatters';
import { TabParamList } from '../../../types/navigation.types';
import { useProfile } from '../../profile/hooks/useProfile';
import { TimeSelector } from '../components/TimeSelector';
import { useBooking } from '../hooks/useBooking';
import { RouteProp } from '@react-navigation/native';

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

const buildInitialArrivalTime = (params?: TabParamList['Booking']) =>
  isValidDate(params?.expectedArrivalTime) ?? roundUpToNextHalfHour();

const BookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookingScreenRouteProp>();
  const initialArrivalTimeRef = useRef(buildInitialArrivalTime(route.params));
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
  const [arrivalTime, setArrivalTime] = useState(initialArrivalTimeRef.current);

  const resetBookingForm = useCallback(() => {
    const defaultVehicle = vehicles.find(vehicle => vehicle.isDefault) ?? vehicles[0] ?? null;
    setArrivalTime(roundUpToNextHalfHour());
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
    const nextArrivalTime = isValidDate(route.params?.expectedArrivalTime);

    if (nextArrivalTime) {
      setArrivalTime(nextArrivalTime);
    }
  }, [route.params?.expectedArrivalTime]);

  useEffect(() => {
    if (!route.params?.resetToken) {
      return;
    }

    resetBookingForm();
  }, [resetBookingForm, route.params?.resetToken]);

  const validateBookingForm = useCallback(() => {
    if (!selectedVehicle) {
      Alert.alert('Loi', 'Vui long chon xe');
      return false;
    }

    const now = Date.now();
    const arrivalTimeMs = arrivalTime.getTime();
    const minTimeMs = now + 30 * 60 * 1000;
    const maxTimeMs = now + 10 * 24 * 60 * 60 * 1000;

    if (arrivalTimeMs < minTimeMs || arrivalTimeMs > maxTimeMs) {
      Alert.alert('Loi', 'Thời gian đặt phải sau 30 phút và trước 10 ngày');
      return false;
    }

    return true;
  }, [arrivalTime, selectedVehicle]);

  const handleBooking = useCallback(async () => {
    if (!validateBookingForm()) {
      return;
    }

    try {
      await createBooking({
        vehicleId: selectedVehicle!,
        expectedArrivalTime: arrivalTime.toISOString(),
      });

      resetBookingForm();
      Alert.alert('Thành công', 'Đặt lịch thành công', [
        {
          text: 'Đóng',
          style: 'cancel',
        },
        {
          text: 'Xem lịch sử',
          onPress: () => (navigation as any).navigate('MyBookings'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đặt lịch');
    }
  }, [arrivalTime, createBooking, navigation, resetBookingForm, selectedVehicle, validateBookingForm]);

  if (isLoadingVehicles && vehicles.length === 0) {
    return <Loading fullscreen text="Dang tai danh sach xe..." />;
  }

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="car-outline"
          title="Chưa có xe"
          description="Vui lòng thêm thông tin xe trước khi đặt lịch đỗ xe"
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
          <Text style={styles.title}>Đặt lịch đỗ xe</Text>
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
                        ? "#FF9500"
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
                      color={"#FF9500"}
                    />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian vào</Text>
          <TimeSelector
            arrivalTime={arrivalTime}
            onArrivalTimeChange={setArrivalTime}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt thông tin</Text>
          <Card>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thời gian vào</Text>
              <Text style={styles.summaryValue}>
                {formatters.dateTime(arrivalTime.toISOString())}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vị trí đỗ xe</Text>
              <Text style={styles.summaryValue}>Hệ thống tự động sắp xếp</Text>
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
        <TouchableOpacity
          style={[
            styles.bookButton,
            isLoading && styles.bookButtonDisabled,
          ]}
          onPress={handleBooking}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loading text="Đang xử lý..." />
          ) : (
            <Text style={styles.bookButtonText}>
              Xác nhận đặt lịch
            </Text>
          )}
        </TouchableOpacity>
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
    lineHeight: 22,
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
    borderColor: "#FF9500",
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
  bookButton: {
    width: '100%',
    backgroundColor: "#FF9500",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },

  bookButtonText: {
    color: '#000000',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default BookingScreen;
