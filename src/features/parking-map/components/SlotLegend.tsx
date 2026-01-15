import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

export const SlotLegend: React.FC = () => {
  const legends = [
    { color: COLORS.available, label: 'Trống' },
    { color: COLORS.occupied, label: 'Đã đỗ' },
    { color: COLORS.reserved, label: 'Đã đặt' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chú thích:</Text>
      <View style={styles.legendsContainer}>
        {legends.map((legend, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: legend.color }]} />
            <Text style={styles.legendText}>{legend.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
    marginRight: SPACING.md,
  },
  legendsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
});
