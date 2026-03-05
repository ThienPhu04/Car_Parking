import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS }     from '../../../shared/constants/colors';
import { SPACING }    from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface LegendItem {
  color: string;
  label: string;
}

const ITEMS: LegendItem[] = [
  { color: COLORS.success,       label: 'Trống'    },
  { color: COLORS.error,         label: 'Có xe'    },
  { color: COLORS.warning,       label: 'Đã đặt'   },
  { color: '#c8d7eb',            label: 'Đường đi' },
];

export const SlotLegend: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Chú thích:</Text>

    <View style={styles.items}>
      {ITEMS.map(item => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  </View>
);

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:   'center',
    flexWrap:     'wrap',
    gap: SPACING.sm,
  },
  title: {
    fontSize:   TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color:      COLORS.textSecondary,
  },
  items: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems:   'center',
    gap: SPACING.xs,
  },
  dot: {
    width:  14,
    height: 14,
    borderRadius: 3,
    borderWidth:  0.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color:    COLORS.textPrimary,
  },
});