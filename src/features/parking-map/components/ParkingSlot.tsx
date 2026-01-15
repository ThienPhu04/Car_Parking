import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ParkingSlot as ParkingSlotType, SlotStatus } from '../../../types/parking.types';
import { COLORS } from '../../../shared/constants/colors';
import { slotHelper } from '../../../shared/utils/slotHelper';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface ParkingSlotProps {
  slot: ParkingSlotType;
  size: number;
  isSelected: boolean;
  onPress: () => void;
}

export const ParkingSlot: React.FC<ParkingSlotProps> = ({
  slot,
  size,
  isSelected,
  onPress,
}) => {
  const getSlotColor = () => {
    return slotHelper.getSlotStatusColor(slot.status);
  };

  const getSlotIcon = () => {
    switch (slot.status) {
      case SlotStatus.AVAILABLE:
        return 'checkmark-circle';
      case SlotStatus.OCCUPIED:
        return 'car';
      case SlotStatus.RESERVED:
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const isDisabled = slot.status !== SlotStatus.AVAILABLE;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size * 1.2,
          backgroundColor: getSlotColor(),
          borderWidth: isSelected ? 3 : 1,
          borderColor: isSelected ? COLORS.primary : COLORS.border,
        },
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <Icon
        name={getSlotIcon()}
        size={size * 0.3}
        color={COLORS.white}
        style={styles.icon}
      />
      <Text style={[styles.code, { fontSize: size * 0.15 }]}>{slot.code}</Text>
      
      {slot.features && slot.features.length > 0 && (
        <View style={styles.featuresContainer}>
          {slot.features.includes('near_elevator') && (
            <Icon name="arrow-up-circle" size={12} color={COLORS.white} />
          )}
          {slot.features.includes('ev_charging') && (
            <Icon name="flash" size={12} color={COLORS.white} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginBottom: 2,
  },
  code: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 4,
    right: 4,
    gap: 2,
  },
});