import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { ParkingSlot, SlotStatus } from '../../../types/parking.types';
import { slotHelper } from '../../../shared/utils/slotHelper';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

interface SlotSuggestionsProps {
  slot: ParkingSlot;
  onPress: () => void;
}

export const SlotSuggestions: React.FC<SlotSuggestionsProps> = ({
  slot,
  onPress,
}) => {
  const getStatusText = () => {
    switch (slot.status) {
      case SlotStatus.AVAILABLE:
        return 'Trống';
      case SlotStatus.OCCUPIED:
        return 'Đã có xe';
      case SlotStatus.RESERVED:
        return 'Đã đặt';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = () => {
    return slotHelper.getSlotStatusColor(slot.status);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={slot.status !== SlotStatus.AVAILABLE}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <View style={styles.content}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor() },
            ]}
          />
          
          <View style={styles.info}>
            <View style={styles.header}>
              <Text style={styles.code}>{slot.code}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor()}20` },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>

            <View style={styles.details}>
              <View style={styles.detailItem}>
                <Icon name="layers-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>Tầng {slot.floor}</Text>
              </View>

              {slot.features && slot.features.length > 0 && (
                <View style={styles.features}>
                  {slot.features.includes('near_elevator') && (
                    <View style={styles.featureBadge}>
                      <Icon name="arrow-up-circle" size={14} color={COLORS.primary} />
                      <Text style={styles.featureBadgeText}>Thang máy</Text>
                    </View>
                  )}
                  {slot.features.includes('ev_charging') && (
                    <View style={styles.featureBadge}>
                      <Icon name="flash" size={14} color={COLORS.warning} />
                      <Text style={styles.featureBadgeText}>Sạc điện</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {slot.status === SlotStatus.AVAILABLE && (
            <Icon
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: -SPACING.md,
    borderRadius: 2,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  code: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  details: {
    gap: SPACING.xs,
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
  features: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    gap: 4,
  },
  featureBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
});