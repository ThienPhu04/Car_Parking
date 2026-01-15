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
  onSetDefault: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="car" size={32} color={COLORS.primary} />
        </View>

        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.licensePlate}>{vehicle.licensePlate}</Text>
            {vehicle.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Mặc định</Text>
              </View>
            )}
          </View>

          {vehicle.brand && vehicle.model && (
            <Text style={styles.model}>
              {vehicle.brand} {vehicle.model}
            </Text>
          )}

          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Icon name="color-palette" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{vehicle.color || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="car-sport" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{vehicle.type}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {!vehicle.isDefault && (
          <TouchableOpacity style={styles.actionButton} onPress={onSetDefault}>
            <Icon name="star-outline" size={20} color={COLORS.warning} />
            <Text style={styles.actionText}>Đặt mặc định</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Icon name="create-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionText}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Icon name="trash-outline" size={20} color={COLORS.error} />
          <Text style={[styles.actionText, { color: COLORS.error }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  licensePlate: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  defaultBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  model: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  details: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});