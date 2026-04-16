import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';

import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { formatters } from '../../../shared/utils/formatters';

interface TimeSelectorProps {
  arrivalTime: Date;
  onArrivalTimeChange: (date: Date) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  arrivalTime,
  onArrivalTimeChange,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <View>
      <Card style={styles.card}>
        <TouchableOpacity style={styles.dateRow} onPress={() => setOpen(true)}>
          <Icon name="calendar-outline" size={24} color={COLORS.primary} />
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Thoi gian vao bai</Text>
            <Text style={styles.dateValue}>{formatters.dateTime(arrivalTime)}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Card>

      <DatePicker
        modal
        open={open}
        date={arrivalTime}
        onConfirm={(date: Date) => {
          onArrivalTimeChange(date);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
        minimumDate={new Date(Date.now() + 30 * 60 * 1000)}
        maximumDate={new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)}
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
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dateValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
});
