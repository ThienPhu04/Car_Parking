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
  leaveTime: Date;
  onArrivalTimeChange: (date: Date) => void;
  onLeaveTimeChange: (date: Date) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  arrivalTime,
  leaveTime,
  onArrivalTimeChange,
  onLeaveTimeChange,
}) => {
  const [activePicker, setActivePicker] = React.useState<'arrival' | 'leave' | null>(null);
  const durations = [30, 60, 120, 180, 240];

  const selectedDuration = Math.round(
    (leaveTime.getTime() - arrivalTime.getTime()) / (60 * 1000),
  );

  const applyDuration = (duration: number) => {
    const nextLeaveTime = new Date(arrivalTime);
    nextLeaveTime.setMinutes(nextLeaveTime.getMinutes() + duration);
    onLeaveTimeChange(nextLeaveTime);
  };

  return (
    <View>
      <Card style={styles.card}>
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => setActivePicker('arrival')}
        >
          <Icon name="calendar-outline" size={24} color={COLORS.primary} />
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Thời gian vào</Text>
            <Text style={styles.dateValue}>{formatters.dateTime(arrivalTime)}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => setActivePicker('leave')}
        >
          <Icon name="time-outline" size={24} color={COLORS.primary} />
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Thời gian rời đi</Text>
            <Text style={styles.dateValue}>{formatters.dateTime(leaveTime)}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Card>

      <DatePicker
        modal
        open={activePicker !== null}
        date={activePicker === 'leave' ? leaveTime : arrivalTime}
        onConfirm={(date: Date) => {
          if (activePicker === 'leave') {
            onLeaveTimeChange(date);
          } else {
            onArrivalTimeChange(date);
          }
          setActivePicker(null);
        }}
        onCancel={() => setActivePicker(null)}
        minimumDate={activePicker === 'leave' ? arrivalTime : new Date()}
        mode="datetime"
        locale="vi"
      />

      <Text style={styles.durationLabel}>Chọn nhanh thời lượng</Text>
      <View style={styles.durationGrid}>
        {durations.map((dur) => (
          <TouchableOpacity
            key={dur}
            style={[
              styles.durationChip,
              selectedDuration === dur && styles.durationChipActive,
            ]}
            onPress={() => applyDuration(dur)}
          >
            <Text
              style={[
                styles.durationText,
                selectedDuration === dur && styles.durationTextActive,
              ]}
            >
              {formatters.duration(dur)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  durationLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  durationChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: '30%',
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  durationTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
