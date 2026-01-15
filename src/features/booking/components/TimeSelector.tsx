import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { formatters } from '../../../shared/utils/formatters';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface TimeSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  selectedDate,
  onDateChange,
  duration,
  onDurationChange,
}) => {
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const durations = [30, 60, 120, 180, 240]; // minutes

  return (
    <View>
      <Card style={styles.card}>
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="calendar-outline" size={24} color={COLORS.primary} />
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Thời gian đến</Text>
            <Text style={styles.dateValue}>
              {formatters.dateTime(selectedDate)}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Card>

      {showDatePicker && (
        <DatePicker
          modal
          open={showDatePicker}
          date={selectedDate}
          onConfirm={(date: Date) => {
            setShowDatePicker(false);
            onDateChange(date);
          }}
          onCancel={() => setShowDatePicker(false)}
          minimumDate={new Date()}
          mode="datetime"
          locale="vi"
        />
      )}

      <Text style={styles.durationLabel}>Thời lượng đỗ xe</Text>
      <View style={styles.durationGrid}>
        {durations.map((dur) => (
          <TouchableOpacity
            key={dur}
            style={[
              styles.durationChip,
              duration === dur && styles.durationChipActive,
            ]}
            onPress={() => onDurationChange(dur)}
          >
            <Text
              style={[
                styles.durationText,
                duration === dur && styles.durationTextActive,
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
