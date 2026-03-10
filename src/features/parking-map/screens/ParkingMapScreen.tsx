import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { COLORS } from '../../../shared/constants/colors';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { Card } from '../../../shared/components/Card';
import { MQTT_TOPICS } from '../../../shared/constants/mqttTopics';

import { EnhancedParkingGrid } from '../components/EnhancedParkingGrid';
import { FloorSelector } from '../components/FloorSelector';
import { NavigationPanel } from '../components/NavigationPanel';
import { SlotLegend } from '../components/SlotLegend';
import { SlotActionModal } from '../components/SlotActionModal';
import { useParkingMap } from '../hooks/useParkingMap';
import { useMQTT } from '../hooks/useMQTT';
import { ParkingNavigator } from '../ultils/navigationHelper';

import {
  CellType, NavigationRoute, ParkingSlot, Position, SlotStatus,
} from '../../../types/parking.types';

const ParkingMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const parkingCode = 'PK001';

  const {
    parkingMap, currentLayout,
    isLoading,
    error, switchFloor, updateSlotStatus, refresh,
  } = useParkingMap(parkingCode);

  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [navRoute, setNavRoute] = useState<NavigationRoute | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showSlotActionModal, setShowSlotActionModal] = useState(false);

  // MQTT
  const mqttTopic = currentLayout
    ? MQTT_TOPICS.SLOT_STATUS(parkingCode, currentLayout.floorLevel)
    : '';
  const { isConnected } = useMQTT(mqttTopic, msg => {
    updateSlotStatus(msg.slotId, msg.status as SlotStatus, statusLabel(msg.status));
  });

  const statusLabel = (s: number) => {
    switch (s) {
      case SlotStatus.AVAILABLE: return 'Trống';
      case SlotStatus.RESERVED: return 'Đã đặt';
      case SlotStatus.OCCUPIED: return 'Đã có xe';
      default: return 'Không xác định';
    }
  };

  const currentFloorInfo = parkingMap?.floors.find(f => f.id === currentLayout?.floorId)
    ?? parkingMap?.floors[0];

  const findNearestRoad = useCallback((pos: Position): Position | null => {
    if (!currentLayout) return null;
    let best: Position | null = null;
    let minD = Infinity;
    currentLayout.cells.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell.type === CellType.ROAD || cell.type === CellType.ENTRY) {
          const d = Math.abs(x - pos.x) + Math.abs(y - pos.y);
          if (d < minD) { minD = d; best = { x, y }; }
        }
      }));
    return best;
  }, [currentLayout]);

  const handleSlotPress = useCallback((slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setNavRoute(null);
    setShowSlotActionModal(true);
  }, []);

  const handleOpenEntrySelector = useCallback(() => {
    setShowSlotActionModal(false);
    setShowEntryModal(true);
  }, []);

  const handleBookSlot = useCallback(() => {
    if (!selectedSlot) return;
    setShowSlotActionModal(false);
    (navigation as any).navigate('Booking', { slotId: selectedSlot.id });
  }, [navigation, selectedSlot]);

  const handleFindRoute = useCallback((entryIdx = 0) => {
    if (!selectedSlot || !currentLayout) return;
    const entry = currentLayout.entries[entryIdx];
    if (!entry) { Alert.alert('Lỗi', 'Không tìm thấy lối vào'); return; }

    setShowEntryModal(false);
    const road = findNearestRoad({ x: selectedSlot.x, y: selectedSlot.y });
    if (!road) { Alert.alert('Lỗi', 'Không thể tìm đường'); return; }

    const route = new ParkingNavigator(currentLayout.cells)
      .findPath({ x: entry.x, y: entry.y }, road);

    if (route) {
      route.path.push({ x: selectedSlot.x, y: selectedSlot.y });
      setNavRoute(route);
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy đường đi');
    }
  }, [selectedSlot, currentLayout, findNearestRoad]);

  const handleClearRoute = useCallback(() => {
    setNavRoute(null);
    setSelectedSlot(null);
    setShowSlotActionModal(false);
  }, []);

  // ✅ FIX: parseInt("F001") = NaN — phải tìm floor bằng id rồi lấy level
  const handleFloorChange = useCallback((floorId: string) => {
    if (!parkingMap) return;
    switchFloor(floorId);
    setSelectedSlot(null);
    setNavRoute(null);
    setShowSlotActionModal(false);
  }, [parkingMap, switchFloor]);

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (isLoading && !parkingMap) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Icon name="alert-circle-outline" size={56} color={COLORS.error} />
        <Text style={styles.errorTitle}>Không thể tải bản đồ</Text>
        <Text style={styles.errorMsg}>{error.message}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!parkingMap) {
    return (
      <SafeAreaView style={styles.center}>
        <Icon name="map-outline" size={56} color={COLORS.textSecondary} />
        <Text style={styles.errorTitle}>Không có dữ liệu</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {parkingMap.name || `Bãi xe ${parkingCode}`}
            </Text>
            {!!parkingMap.location && (
              <Text style={styles.headerSub} numberOfLines={1}>{parkingMap.location}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {navRoute && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleClearRoute}>
              <Icon name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => Alert.alert('Hướng dẫn',
              '🟢 Xanh: Trống\n🔴 Đỏ: Có xe\n🟡 Vàng: Đã đặt\nIN: Lối vào | OUT: Lối ra')}
          >
            <Icon name="help-circle-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floor tabs */}
      <FloorSelector
        selectedFloor={currentLayout?.floorId ?? parkingMap.floors[0]?.id ?? ''}
        onFloorChange={handleFloorChange}
        floors={parkingMap.floors}
      />

      {/* Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <StatChip icon="checkmark-circle" color={COLORS.success}
            label={`${currentFloorInfo?.availableSlots ?? 0} trống`} />
          <StatChip icon="car" color={COLORS.error}
            label={`${currentFloorInfo?.occupiedSlots ?? 0} có xe`} />
          <StatChip icon="time" color={COLORS.warning}
            label={`${currentFloorInfo?.reservedSlots ?? 0} đã đặt`} />
        </View>
      </Card>

      {/* Selected slot info */}
      {selectedSlot && (
        <Card style={styles.infoCard}>
          <InfoRow icon="location" color={COLORS.primary}
            text={`${selectedSlot.name} (${selectedSlot.code})`} />
          <InfoRow icon="business" color={COLORS.textSecondary}
            text={`Khu: ${selectedSlot.zone}`} />
        </Card>
      )}

      {/* Grid */}
      {currentLayout ? (
        <EnhancedParkingGrid
          layout={currentLayout}
          selectedSlot={selectedSlot}
          navigationPath={navRoute?.path ?? null}
          onSlotPress={handleSlotPress}
        />
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.center}>
          <Icon name="map-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.loadingText}>Bai xe chua co so do tang</Text>
        </View>
      )}

      {navRoute && <NavigationPanel route={navRoute} onClose={handleClearRoute} />}

      <View style={styles.legendBar}>
        <SlotLegend />
      </View>

      <SlotActionModal
        visible={showSlotActionModal}
        slot={selectedSlot}
        onClose={() => setShowSlotActionModal(false)}
        onFindRoute={handleOpenEntrySelector}
        onBookSlot={handleBookSlot}
      />

      {/* Entry selector modal */}
      <Modal visible={showEntryModal} transparent animationType="slide"
        onRequestClose={() => setShowEntryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn lối vào</Text>
              <TouchableOpacity onPress={() => setShowEntryModal(false)}>
                <Icon name="close" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            {(currentLayout?.entries ?? []).map((entry, idx) => (
              <TouchableOpacity key={entry.id} style={styles.entryRow}
                onPress={() => handleFindRoute(idx)}>
                <Icon name="enter-outline" size={22} color={COLORS.success} />
                <Text style={styles.entryText}>{entry.name}</Text>
                <Icon name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatChip: React.FC<{ icon: string; color: string; label: string }> = ({ icon, color, label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
    <Icon name={icon} size={15} color={color} />
    <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textPrimary }}>{label}</Text>
  </View>
);

const InfoRow: React.FC<{ icon: string; color: string; text: string }> = ({ icon, color, text }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
    <Icon name={icon} size={16} color={color} />
    <Text style={{ flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textPrimary }} numberOfLines={1}>
      {text}
    </Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.background, padding: SPACING.xl
  },
  loadingText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary, marginTop: SPACING.lg, textAlign: 'center'
  },
  errorMsg: {
    fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary,
    textAlign: 'center', marginTop: SPACING.sm
  },
  retryBtn: {
    marginTop: SPACING.lg, backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: 8
  },
  retryText: {
    color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary
  },
  headerSub: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, marginTop: 1 },
  iconBtn: { padding: SPACING.xs },
  statsCard: {
    marginHorizontal: SPACING.md, marginTop: SPACING.sm,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  infoCard: { marginHorizontal: SPACING.md, marginTop: SPACING.sm, padding: SPACING.md },
  legendBar: {
    padding: SPACING.md, backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1, borderTopColor: COLORS.border
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.backgroundSecondary,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '50%'
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary
  },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.md
  },
  entryText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textPrimary },
});

export default ParkingMapScreen;
