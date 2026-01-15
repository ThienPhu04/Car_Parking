import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { SlotStatus } from '../../../types/parking.types';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface FilterOptionsProps {
  filters: {
    floor?: number;
    features?: string[];
    status?: SlotStatus;
  };
  onUpdateFilters: (filters: any) => void;
  onClearFilters: () => void;
}

export const FilterOptions: React.FC<FilterOptionsProps> = ({
  filters,
  onUpdateFilters,
  onClearFilters,
}) => {
  const floors = [1, 2, 3, 4];
  const features = [
    { id: 'near_elevator', label: 'Gần thang máy', icon: '🛗' },
    { id: 'near_exit', label: 'Gần lối ra', icon: '🚪' },
    { id: 'covered', label: 'Có mái che', icon: '☂️' },
    { id: 'ev_charging', label: 'Sạc điện', icon: '⚡' },
  ];

  const toggleFloor = (floor: number) => {
    onUpdateFilters({
      floor: filters.floor === floor ? undefined : floor,
    });
  };

  const toggleFeature = (featureId: string) => {
    const currentFeatures = filters.features || [];
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter((f) => f !== featureId)
      : [...currentFeatures, featureId];
    
    onUpdateFilters({
      features: newFeatures.length > 0 ? newFeatures : undefined,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tầng</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          {floors.map((floor) => (
            <TouchableOpacity
              key={floor}
              style={[
                styles.chip,
                filters.floor === floor && styles.chipActive,
              ]}
              onPress={() => toggleFloor(floor)}
            >
              <Text
                style={[
                  styles.chipText,
                  filters.floor === floor && styles.chipTextActive,
                ]}
              >
                Tầng {floor}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đặc điểm</Text>
        <View style={styles.featureGrid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.featureChip,
                filters.features?.includes(feature.id) && styles.featureChipActive,
              ]}
              onPress={() => toggleFeature(feature.id)}
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text
                style={[
                  styles.featureText,
                  filters.features?.includes(feature.id) && styles.featureTextActive,
                ]}
              >
                {feature.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {(filters.floor || filters.features?.length) && (
        <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
          <Text style={styles.clearButtonText}>Xóa tất cả bộ lọc</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  chipContainer: {
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  featureChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  featureIcon: {
    fontSize: 16,
  },
  featureText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  featureTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  clearButton: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});