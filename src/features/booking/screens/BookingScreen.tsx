import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../shared/constants/colors';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { TimeSelector } from '../components/TimeSelector';
import { BookingSummary } from '../components/BookingSummary';
import { useBooking } from '../hooks/useBooking';
import { useProfile } from '../../profile/hooks/useProfile';
import { Loading } from '../../../shared/components/Loading';
import { EmptyState } from '../../../shared/components/EmptyState';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

type BookingScreenRouteProp = RouteProp<{ Booking: { slotId?: string } }, 'Booking'>;

const BookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookingScreenRouteProp>();
  const { slotId } = route.params || {};

  const { vehicles } = useProfile();
  const { createBooking, isLoading } = useBooking();

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [duration, setDuration] = useState(60); // minutes
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    // Auto select default vehicle
    const defaultVehicle = vehicles.find((v) => v.isDefault);
    if (defaultVehicle) {
      setSelectedVehicle(defaultVehicle.id);
    }
  }, [vehicles]);

  const handleBooking = async () => {
    if (!selectedVehicle) {
      Alert.alert('Lỗi', 'Vui lòng chọn xe');
      return;
    }

    if (!slotId) {
      Alert.alert('Lỗi', 'Vui lòng chọn chỗ đỗ');
      return;
    }

    try {
      const booking = await createBooking({
        slotId,
        vehicleId: selectedVehicle,
        startTime: selectedDate.toISOString(),
        duration,
      });

      Alert.alert('Thành công', 'Đặt chỗ thành công!', [
        {
          text: 'OK',
          onPress: () => (navigation as any).navigate('BookingConfirm' as any, {
            bookingId: booking.id,
          }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đặt chỗ');
    }
  };

  const calculateEndTime = () => {
    const end = new Date(selectedDate);
    end.setMinutes(end.getMinutes() + duration);
    return end;
  };

  if (vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="car-outline"
          title="Chưa có xe"
          description="Vui lòng thêm thông tin xe để đặt chỗ"
          actionLabel="Thêm xe"
          onAction={() => (navigation as any).navigate('VehicleManagement' as any)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Đặt chỗ đỗ xe</Text>
          <Text style={styles.subtitle}>
            Chọn thông tin để đặt chỗ trước
          </Text>
        </View>

        {/* Vehicle Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn xe</Text>
          {vehicles.map((vehicle) => (
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
                    <Text style={styles.vehiclePlate}>
                      {vehicle.licensePlate}
                    </Text>
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

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn thời gian</Text>
          <TimeSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            duration={duration}
            onDurationChange={setDuration}
          />
        </View>

        {/* Slot Info (if provided) */}
        {slotId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vị trí đỗ xe</Text>
            <Card>
              <View style={styles.slotInfo}>
                <Icon name="location" size={24} color={COLORS.primary} />
                <View style={styles.slotDetails}>
                  <Text style={styles.slotCode}>Slot {slotId}</Text>
                  <Text style={styles.slotFloor}>Tầng 1</Text>
                </View>
                <TouchableOpacity
                  onPress={() => (navigation as any).navigate('ParkingMap' as any)}
                >
                  <Text style={styles.changeText}>Đổi</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {/* Summary Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt</Text>
          <Card>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thời gian bắt đầu:</Text>
              <Text style={styles.summaryValue}>
                {selectedDate.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thời gian kết thúc:</Text>
              <Text style={styles.summaryValue}>
                {calculateEndTime().toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thời lượng:</Text>
              <Text style={styles.summaryValue}>{duration} phút</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Xác nhận đặt chỗ"
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
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default BookingScreen;