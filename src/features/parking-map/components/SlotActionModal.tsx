import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { ParkingSlot, SlotStatus } from '../../../types/parking.types';

interface SlotActionModalProps {
  visible: boolean;
  slot: ParkingSlot | null;
  onClose: () => void;
  onFindRoute: () => void;
  onBookSlot: () => void;
}

export const SlotActionModal: React.FC<SlotActionModalProps> = ({
  visible,
  slot,
  onClose,
  onFindRoute,
  onBookSlot,
}) => {
  if (!slot) return null;

  const isAvailable = slot.status === SlotStatus.AVAILABLE;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>

          {/* Title */}
          <Text style={styles.title}>{slot.name}</Text>
          <Text style={styles.code}>{slot.code}</Text>

          {/* Info */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Khu</Text>
            <Text style={styles.value}>{slot.zone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Trạng thái</Text>
            <View
              style={[
                styles.statusBadge,
                isAvailable ? styles.available : styles.unavailable,
              ]}
            >
              <Text style={styles.statusText}>{slot.statusName}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>

            {isAvailable && (
              <>
                <TouchableOpacity style={styles.secondaryBtn} onPress={onFindRoute}>
                  <Text style={styles.secondaryText}>Tìm đường</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryBtn} onPress={onBookSlot}>
                  <Text style={styles.primaryText}>Đặt chỗ</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },

  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: SPACING.lg,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },

  code: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },

  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },

  value: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  available: {
    backgroundColor: '#E6F7F4',
  },

  unavailable: {
    backgroundColor: '#FDECEA',
  },

  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.lg,
    gap: 10,
  },

  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },

  cancelText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },

  secondaryBtn: {
    backgroundColor: '#F1F3F5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  secondaryText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },

  primaryBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  primaryText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});