// src/features/parking-map/screens/ParkingMapScreen.tsx - CẬP NHẬT
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../shared/constants/colors';
import { Card } from '../../../shared/components/Card';
import { NavigationPanel } from '../components/NavigationPanel';
import { FloorSelector } from '../components/FloorSelector';
import { SlotLegend } from '../components/SlotLegend';
import { useParkingMap } from '../hooks/useParkingMap';
import { useMQTT } from '../hooks/useMQTT';
import { 
  ParkingSlot, 
  Position, 
  NavigationRoute, 
  CellType,
  SlotStatus 
} from '../../../types/parking.types';
import { MQTT_TOPICS } from '@shared/constants/mqttTopics';
import { ParkingNavigator } from '../ultils/navigationHelper';
import { SPACING } from '@shared/constants/spacing';
import { TYPOGRAPHY } from '@shared/constants/typography';
import { EnhancedParkingGrid } from '../components/EnhancedParkingGrid';

const ParkingMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const parkingCode = 'PK001';

  const {
    parkingMap,
    currentLayout,
    isLoading,
    error,
    switchFloor,
    updateSlotStatus,
    refresh,
  } = useParkingMap(parkingCode);

  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [navigationRoute, setNavigationRoute] = useState<NavigationRoute | null>(null);
  const [showEntrySelector, setShowEntrySelector] = useState(false);

  // MQTT real-time updates
  const { isConnected } = useMQTT(
    currentLayout ? MQTT_TOPICS.SLOT_STATUS(parkingCode, currentLayout.floorLevel) : '',
    (message) => {
      // Update slot status real-time
      updateSlotStatus(
        message.slotId,
        message.status as SlotStatus,
        getStatusName(message.status)
      );
    }
  );

  const getStatusName = (status: number): string => {
    switch (status) {
      case SlotStatus.AVAILABLE:
        return 'Trống';
      case SlotStatus.RESERVED:
        return 'Đã đặt';
      case SlotStatus.OCCUPIED:
        return 'Đã có xe';
      default:
        return 'Không xác định';
    }
  };

  const handleSlotPress = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setNavigationRoute(null);

    if (slot.status === SlotStatus.AVAILABLE) {
      Alert.alert(
        `${slot.name} (${slot.code})`,
        `Khu vực: ${slot.zone}\nTrạng thái: ${slot.statusName}`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Tìm đường đi',
            onPress: () => setShowEntrySelector(true),
          },
          {
            text: 'Đặt chỗ',
            onPress: () => handleBooking(slot),
          },
        ]
      );
    } else {
      Alert.alert(
        'Thông báo',
        `Chỗ này ${slot.statusName.toLowerCase()}`
      );
    }
  };

  const handleFindRoute = (entryIndex: number = 0) => {
    if (!selectedSlot || !currentLayout) return;

    const entry = currentLayout.entries[entryIndex];
    if (!entry) {
      Alert.alert('Lỗi', 'Không tìm thấy lối vào');
      return;
    }

    setShowEntrySelector(false);

    // Tìm ô đường đi gần slot nhất
    const nearestRoad = findNearestRoad(
      currentLayout.cells,
      { x: selectedSlot.x, y: selectedSlot.y }
    );

    if (!nearestRoad) {
      Alert.alert('Lỗi', 'Không thể tìm đường đi đến chỗ này');
      return;
    }

    // Sử dụng A* để tìm đường
    const navigator = new ParkingNavigator(currentLayout.cells);
    const route = navigator.findPath(
      { x: entry.x, y: entry.y },
      nearestRoad
    );

    if (route) {
      // Thêm điểm cuối là slot
      route.path.push({ x: selectedSlot.x, y: selectedSlot.y });
      setNavigationRoute(route);
      Alert.alert(
        'Tìm đường thành công',
        `Khoảng cách: ${route.distance}m\nThời gian ước tính: ${route.estimatedTime}s`
      );
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy đường đi');
    }
  };

  const findNearestRoad = (
    cells: any[][],
    position: Position
  ): Position | null => {
    let nearest: Position | null = null;
    let minDistance = Infinity;

    for (let y = 0; y < cells.length; y++) {
      for (let x = 0; x < cells[y].length; x++) {
        const cell = cells[y][x];
        if (cell.type === CellType.ROAD || cell.type === CellType.ENTRY) {
          const distance = Math.abs(x - position.x) + Math.abs(y - position.y);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = { x, y };
          }
        }
      }
    }

    return nearest;
  };

  const handleClearRoute = () => {
    setNavigationRoute(null);
    setSelectedSlot(null);
  };

  const handleBooking = (slot: ParkingSlot) => {
    (navigation as any).navigate('Booking', { slotId: slot.id });
  };

  const handleFloorChange = (floorLevel: number) => {
    switchFloor(floorLevel);
    setSelectedSlot(null);
    setNavigationRoute(null);
  };

  // Loading state
  if (isLoading && !parkingMap) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải bản đồ bãi đỗ...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Không thể tải bản đồ</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // No data state
  if (!parkingMap || !currentLayout) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="map-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.errorTitle}>Không có dữ liệu</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? COLORS.success : COLORS.error },
            ]}
          />
          <View>
            <Text style={styles.headerTitle}>{parkingMap.name}</Text>
            <Text style={styles.headerSubtitle}>{parkingMap.location}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {navigationRoute && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearRoute}
            >
              <Icon name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => Alert.alert(
              'Hướng dẫn',
              '🟢 Xanh: Chỗ trống\n🔴 Đỏ: Đã có xe\n🟡 Vàng: Đã đặt\n⬇️ Lối vào\n⬆️ Lối ra\n\nChọn chỗ trống để tìm đường đi'
            )}
          >
            <Icon name="help-circle-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floor Selector */}
      {parkingMap.floors.length > 1 && (
        <FloorSelector
          selectedFloor={currentLayout.floorLevel}
          onFloorChange={handleFloorChange}
          floors={parkingMap.floors.map(f => f.level)}
        />
      )}

      {/* Floor Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.statText}>
              {parkingMap.floors.find(f => f.level === currentLayout.floorLevel)?.availableSlots || 0} trống
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="car" size={16} color={COLORS.error} />
            <Text style={styles.statText}>
              {parkingMap.floors.find(f => f.level === currentLayout.floorLevel)?.occupiedSlots || 0} đã đỗ
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="time" size={16} color={COLORS.warning} />
            <Text style={styles.statText}>
              {parkingMap.floors.find(f => f.level === currentLayout.floorLevel)?.reservedSlots || 0} đã đặt
            </Text>
          </View>
        </View>
      </Card>

      {/* Selected Slot Info */}
      {selectedSlot && (
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="location" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              {selectedSlot.name} ({selectedSlot.code})
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="business" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Khu vực: {selectedSlot.zone}
            </Text>
          </View>
          {navigationRoute && (
            <>
              <View style={styles.infoRow}>
                <Icon name="navigate" size={20} color={COLORS.success} />
                <Text style={styles.infoText}>
                  Khoảng cách: {navigationRoute.distance}m
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="time" size={20} color={COLORS.warning} />
                <Text style={styles.infoText}>
                  Thời gian: {navigationRoute.estimatedTime}s
                </Text>
              </View>
            </>
          )}
        </Card>
      )}

      {/* Parking Grid */}
      <EnhancedParkingGrid
        layout={currentLayout}
        selectedSlot={selectedSlot}
        navigationPath={navigationRoute?.path || null}
        onSlotPress={handleSlotPress}
      />

      {/* Navigation Instructions */}
      {navigationRoute && (
        <NavigationPanel
          route={navigationRoute}
          onClose={handleClearRoute}
        />
      )}

      {/* Legend */}
      <View style={styles.legendContainer}>
        <SlotLegend />
      </View>

      {/* Entry Selector Modal */}
      <Modal
        visible={showEntrySelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEntrySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn lối vào</Text>
              <TouchableOpacity onPress={() => setShowEntrySelector(false)}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {currentLayout.entries.map((entry, index) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryItem}
                onPress={() => handleFindRoute(index)}
              >
                <Icon name="enter-outline" size={24} color={COLORS.success} />
                <Text style={styles.entryText}>{entry.name}</Text>
                <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  infoButton: {
    padding: SPACING.xs,
  },
  statsCard: {
    margin: SPACING.md,
    padding: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  infoCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  legendContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  entryText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
});

export default ParkingMapScreen;