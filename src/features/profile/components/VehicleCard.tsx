import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { Vehicle } from '../../../types/vehicle.types';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onEdit,
  onDelete,
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icon name="car" size={32} color={COLORS.primary} />
        </View>

        <View style={styles.info}>
          <Text style={styles.licensePlate}>{vehicle.licensePlate}</Text>
          {vehicle.brand && (
            <Text style={styles.vehicleName}>
              {vehicle.brand} {vehicle.model || ''}
            </Text>
          )}
        </View>

        <View style={styles.verticalActions}>
          <TouchableOpacity 
            style={styles.verticalActionButton} 
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Icon name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.verticalActionButton} 
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Icon name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  licensePlate: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  verticalActions: {
    paddingLeft: SPACING.md,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    gap: SPACING.md,
  },
  verticalActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});