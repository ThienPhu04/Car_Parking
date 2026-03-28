import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../shared/components/Card';
import { COLORS} from '../../../shared/constants/colors';
import { Booking, BookingStatus } from '../../../types/booking.types';
import { formatters } from '../../../shared/utils/formatters';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
  onCancel?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  onCancel,
}) => {
  const getStatusColor = () => {
    switch (booking.status) {
      case BookingStatus.ACTIVE:
        return COLORS.success;
      case BookingStatus.COMPLETED:
        return COLORS.textSecondary;
      case BookingStatus.CANCELLED:
        return COLORS.error;
      default:
        return COLORS.warning;
    }
  };

  const getStatusText = () => {
    switch (booking.status) {
      case BookingStatus.ACTIVE:
        return 'Äang hoáº¡t Ä‘á»™ng';
      case BookingStatus.COMPLETED:
        return 'HoÃ n thÃ nh';
      case BookingStatus.CANCELLED:
        return 'ÄÃ£ há»§y';
      case BookingStatus.PENDING:
        return 'Chá» xÃ¡c nháº­n';
      case BookingStatus.EXPIRED:
        return 'ÄÃ£ háº¿t háº¡n';
      default:
        return 'KhÃ´ng xÃ¡c Ä‘á»‹nh';
    }
  };

  const getStatusIcon = () => {
    switch (booking.status) {
      case BookingStatus.ACTIVE:
        return 'checkmark-circle';
      case BookingStatus.COMPLETED:
        return 'checkmark-done-circle';
      case BookingStatus.CANCELLED:
        return 'close-circle';
      default:
        return 'time';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: `${getStatusColor()}20` },
              ]}
            >
              <Icon
                name={getStatusIcon()}
                size={24}
                color={getStatusColor()}
              />
            </View>
            <View>
              <Text style={styles.slotCode}>
                {booking.slot?.code || 'N/A'}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor()}20` },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>
          </View>
          {onPress && (
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Icon name="layers-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              Táº§ng {booking.slot?.floorLevel || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="car-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {booking.vehicle?.licensePlate || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {formatters.dateTime(booking.startTime)}
            </Text>
          </View>
        </View>

        {onCancel && booking.status === BookingStatus.ACTIVE && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Icon name="close-circle-outline" size={20} color={COLORS.error} />
            <Text style={styles.cancelText}>Há»§y Ä‘áº·t chá»—</Text>
          </TouchableOpacity>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  slotCode: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  details: {
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  cancelText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});