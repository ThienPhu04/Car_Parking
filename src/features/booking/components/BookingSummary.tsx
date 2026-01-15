import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { formatters } from '../../../shared/utils/formatters';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { SPACING } from '../../../shared/constants/spacing';

interface BookingSummaryProps {
  slotCode?: string;
  vehiclePlate?: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  slotCode,
  vehiclePlate,
  startTime,
  endTime,
  duration,
}) => {
  return (
    <Card>
      <Text style={styles.title}>Tóm tắt đặt chỗ</Text>
      
      {slotCode && (
        <View style={styles.row}>
          <Text style={styles.label}>Vị trí:</Text>
          <Text style={styles.value}>{slotCode}</Text>
        </View>
      )}
      
      {vehiclePlate && (
        <View style={styles.row}>
          <Text style={styles.label}>Biển số xe:</Text>
          <Text style={styles.value}>{vehiclePlate}</Text>
        </View>
      )}
      
      <View style={styles.row}>
        <Text style={styles.label}>Bắt đầu:</Text>
        <Text style={styles.value}>{formatters.dateTime(startTime)}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Kết thúc:</Text>
        <Text style={styles.value}>{formatters.dateTime(endTime)}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Thời lượng:</Text>
        <Text style={styles.value}>{formatters.duration(duration)}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
});