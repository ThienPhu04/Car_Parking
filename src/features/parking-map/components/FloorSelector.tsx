import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Floor } from '../../../types/parking.types';
import { COLORS }     from '../../../shared/constants/colors';
import { SPACING }    from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface FloorSelectorProps {
  selectedFloor: string;           // floor.id
  onFloorChange: (floorId: string) => void;
  floors: Floor[];
}

export const FloorSelector: React.FC<FloorSelectorProps> = ({
  selectedFloor, onFloorChange, floors,
}) => {
  if (floors.length <= 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {floors.map(floor => {
          const isActive = selectedFloor === floor.id;
          return (
            <TouchableOpacity
              key={floor.id}
              style={[styles.btn, isActive && styles.btnActive]}
              onPress={() => onFloorChange(floor.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.text, isActive && styles.textActive]}>
                {floor.name}
              </Text>
              {/* Hiện số chỗ trống nhỏ bên dưới */}
              <Text style={[styles.sub, isActive && styles.subActive]}>
                {floor.availableSlots} trống
              </Text>
            </TouchableOpacity>
          );
        })}
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
  scroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  btn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    minWidth: 80,
  },
  btnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  textActive: {
    color: COLORS.white,
  },
  sub: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});