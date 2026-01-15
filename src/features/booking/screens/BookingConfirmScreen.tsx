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
import { CountdownTimer } from '../components/CountdownTimer';
import { bookingService } from '../services/bookingService';
import { Booking } from '../../../types/booking.types';
import { Loading } from '../../../shared/components/Loading';
import { formatters } from '../../../shared/utils/formatters';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

type BookingConfirmRouteProp = RouteProp<
  { BookingConfirm: { bookingId: string } },
  'BookingConfirm'
>;

const BookingConfirmScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookingConfirmRouteProp>();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const response = await bookingService.getBooking(bookingId);
      setBooking(response.data);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin đặt chỗ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Hủy đặt chỗ',
      'Bạn có chắc muốn hủy đặt chỗ này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đặt chỗ',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.cancelBooking(bookingId);
              Alert.alert('Thành công', 'Đã hủy đặt chỗ', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể hủy đặt chỗ');
            }
          },
        },
      ]
    );
  };

  const handleTimeout = () => {
    Alert.alert(
      'Hết thời gian giữ chỗ',
      'Đặt chỗ của bạn đã bị hủy do quá thời gian',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading fullscreen />;
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

        <Text style={styles.title}>Đặt chỗ thành công!</Text>
        <Text style={styles.subtitle}>
          Vui lòng đến trước khi hết thời gian giữ chỗ
        </Text>

        <CountdownTimer
          endTime={new Date(booking.startTime)}
          onTimeout={handleTimeout}
        />

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="location" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Vị trí</Text>
              <Text style={styles.infoValue}>
                {booking.slot?.code} - Tầng {booking.slot?.floor}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="car" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phương tiện</Text>
              <Text style={styles.infoValue}>
                {booking.vehicle?.licensePlate}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="time" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thời gian</Text>
              <Text style={styles.infoValue}>
                {formatters.dateTime(booking.startTime)} -{' '}
                {formatters.time(booking.endTime)}
              </Text>
            </View>
          </View>
        </Card>

        {/* QR Code placeholder */}
        <Card style={styles.qrCard}>
          <Text style={styles.qrTitle}>Mã QR Check-in</Text>
          <View style={styles.qrPlaceholder}>
            <Icon name="qr-code" size={120} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.qrSubtitle}>
            Quét mã này khi vào bãi đỗ xe
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Xem bản đồ"
            onPress={() => (navigation as any).navigate('ParkingMap' as any)}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Hủy đặt chỗ"
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