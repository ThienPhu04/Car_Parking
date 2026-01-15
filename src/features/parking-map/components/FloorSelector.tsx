import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface FloorSelectorProps {
  selectedFloor: number;
  onFloorChange: (floor: number) => void;
  floors: number[];
}

export const FloorSelector: React.FC<FloorSelectorProps> = ({
  selectedFloor,
  onFloorChange,
  floors,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {floors.map((floor) => (
          <TouchableOpacity
            key={floor}
            style={[
              styles.floorButton,
              selectedFloor === floor && styles.floorButtonActive,
            ]}
            onPress={() => onFloorChange(floor)}
          >
            <Text
              style={[
                styles.floorText,
                selectedFloor === floor && styles.floorTextActive,
              ]}
            >
              Tầng {floor}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  floorButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  floorButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  floorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  floorTextActive: {
    color: COLORS.white,
  },
});