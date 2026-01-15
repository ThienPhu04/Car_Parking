import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ParkingSlot as ParkingSlotType } from '../../../types/parking.types';
import { ParkingSlot } from './ParkingSlot';
import { SPACING } from '../../../shared/constants/spacing';

const { width } = Dimensions.get('window');
const GRID_COLS = 6;
const SLOT_SIZE = (width - SPACING.md * 2 - SPACING.sm * (GRID_COLS - 1)) / GRID_COLS;

interface ParkingGridProps {
  slots: ParkingSlotType[];
  selectedSlot: ParkingSlotType | null;
  onSlotPress: (slot: ParkingSlotType) => void;
}

export const ParkingGrid: React.FC<ParkingGridProps> = ({
  slots,
  selectedSlot,
  onSlotPress,
}) => {
  // Group slots by row
  const rows: ParkingSlotType[][] = [];
  const sortedSlots = [...slots].sort((a, b) => {
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y;
    }
    return a.position.x - b.position.x;
  });

  let currentRow: ParkingSlotType[] = [];
  let currentY = -1;

  sortedSlots.forEach((slot) => {
    if (slot.position.y !== currentY) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [slot];
      currentY = slot.position.y;
    } else {
      currentRow.push(slot);
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((slot) => (
            <ParkingSlot
              key={slot.id}
              slot={slot}
              size={SLOT_SIZE}
              isSelected={selectedSlot?.id === slot.id}
              onPress={() => onSlotPress(slot)}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
});