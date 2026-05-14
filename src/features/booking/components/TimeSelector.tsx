import React from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';

import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { CONFIG } from '../../../shared/constants/config';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { formatters } from '../../../shared/utils/formatters';
import {
  BOOKING_RESTRICTED_HOURS_MESSAGE,
  getBookingMaxArrivalDate,
  getBookingMinArrivalDate,
  isRestrictedBookingHour,
} from '../utils/bookingValidation';

interface TimeSelectorProps {
  arrivalTime: Date;
  onArrivalTimeChange: (date: Date) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  arrivalTime,
  onArrivalTimeChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const now = new Date();
  const minimumDate = getBookingMinArrivalDate(now);
  const maximumDate = getBookingMaxArrivalDate(now);

  return (
    <View>
      <Card style={styles.card}>
        <TouchableOpacity style={styles.dateRow} onPress={() => setOpen(true)}>
          <Icon name="calendar-outline" size={24} color="#FF9500" />
          <View style={styles.dateInfo}>
            <Text style={styles.dateValue}>{formatters.dateTime(arrivalTime)}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#FF9500" />
        </TouchableOpacity>
      </Card>

      <DatePicker
        modal
        open={open}
        date={arrivalTime}
        onConfirm={(date: Date) => {
          if (isRestrictedBookingHour(date)) {
            setOpen(false);
            Alert.alert('Thông báo', BOOKING_RESTRICTED_HOURS_MESSAGE);
            return;
          }

          onArrivalTimeChange(date);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        mode="datetime"
        locale="vi"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  dateLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#FF9500',
    marginBottom: SPACING.xs,
  },
  dateValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#000000',
  },
  helperText: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
