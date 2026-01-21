import { FloorLayout, ParkingSlot, Position, CellType, NavigationRoute } from "@app-types/parking.types";
import { useNavigation } from "@react-navigation/native";
import { Card } from "@shared/components/Card";
import { COLORS } from "@shared/constants/colors";
import { MQTT_TOPICS } from "@shared/constants/mqttTopics";
import { SPACING } from "@shared/constants/spacing";
import { TYPOGRAPHY } from "@shared/constants/typography";
import React, { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Icon from 'react-native-vector-icons/Ionicons';
import { FloorSelector } from "../components/FloorSelector";
import { SlotLegend } from "../components/SlotLegend";
import { useMQTT } from "../hooks/useMQTT";
import { generateFloorLayout } from "../ultils/floorLayoutGenerator";
import { ParkingNavigator } from "../ultils/navigationHelper";
import { ParkingGrid } from "../components/ParkingGrid";
import { NavigationPanel } from "../components/NavigationPanel";

const ParkingMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [floorLayout, setFloorLayout] = useState<FloorLayout | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [navigationRoute, setNavigationRoute] = useState<NavigationRoute | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showEntrySelector, setShowEntrySelector] = useState(false);

  const lotId = 'lot_001';

  // MQTT real-time updates
  const { isConnected } = useMQTT(
    MQTT_TOPICS.SLOT_STATUS(lotId, selectedFloor),
    (message) => {
      // Update slot status in real-time
      if (floorLayout) {
        const updatedSlots = floorLayout.slots.map(slot =>
          slot.id === message.slotId ? { ...slot, status: message.status } : slot
        );
        setFloorLayout({ ...floorLayout, slots: updatedSlots });
      }
    }
  );

  useEffect(() => {
    loadFloorLayout(selectedFloor);
  }, [selectedFloor]);

  const loadFloorLayout = (floor: number) => {
    const layout = generateFloorLayout(floor);
    setFloorLayout(layout);
    setSelectedSlot(null);
    setNavigationRoute(null);
    setIsNavigating(false);
  };

  const handleSlotPress = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setNavigationRoute(null);

    if (slot.status === 'available') {
      Alert.alert(
        `Chỗ ${slot.code}`,
        'Bạn muốn làm gì?',
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
      Alert.alert('Thông báo', 'Chỗ này đã có xe hoặc đã được đặt');
    }
  };

  const handleFindRoute = (entryIndex: number = 0) => {
    if (!selectedSlot || !floorLayout) return;

    const entry = floorLayout.entries[entryIndex];
    if (!entry) {
      Alert.alert('Lỗi', 'Không tìm thấy lối vào');
      return;
    }

    setShowEntrySelector(false);
    setIsNavigating(true);

    // Tìm ô đường đi gần slot nhất
    const nearestRoadToSlot = findNearestRoad(
      floorLayout,
      { x: selectedSlot.x, y: selectedSlot.y }
    );

    if (!nearestRoadToSlot) {
      Alert.alert('Lỗi', 'Không thể tìm đường đi đến chỗ này');
      setIsNavigating(false);
      return;
    }

    // Sử dụng A* để tìm đường
    const navigator = new ParkingNavigator(floorLayout.cells);
    const route = navigator.findPath(
      { x: entry.x, y: entry.y },
      nearestRoadToSlot
    );

    if (route) {
      // Thêm điểm cuối là slot
      route.path.push({ x: selectedSlot.x, y: selectedSlot.y });
      setNavigationRoute(route);
      Alert.alert(
        'Tìm đường thành công',
        `Khoảng cách: ${route.distance}m\nThời gian: ${route.estimatedTime}s`
      );
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy đường đi');
    }

    setIsNavigating(false);
  };

  const findNearestRoad = (layout: FloorLayout, position: Position): Position | null => {
    let nearest: Position | null = null;
    let minDistance = Infinity;

    for (let y = 0; y < layout.height; y++) {
      for (let x = 0; x < layout.width; x++) {
        const cell = layout.cells[y][x];
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
    (navigation as any).navigate('Booking' as any, { slotId: slot.id });
  };

  if (!floorLayout) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải bản đồ...</Text>
      </View>
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
          <Text style={styles.headerTitle}>
            {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
          </Text>
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
      <FloorSelector
        selectedFloor={selectedFloor}
        onFloorChange={setSelectedFloor}
        floors={[1, 2, 3, 4]}
      />

      {/* Info Card */}
      {selectedSlot && (
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="car" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Chỗ đã chọn: <Text style={styles.infoValue}>{selectedSlot.code}</Text>
            </Text>
          </View>
          {navigationRoute && (
            <>
              <View style={styles.infoRow}>
                <Icon name="navigate" size={20} color={COLORS.success} />
                <Text style={styles.infoText}>
                  Khoảng cách: <Text style={styles.infoValue}>{navigationRoute.distance}m</Text>
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="time" size={20} color={COLORS.warning} />
                <Text style={styles.infoText}>
                  Thời gian: <Text style={styles.infoValue}>{navigationRoute.estimatedTime}s</Text>
                </Text>
              </View>
            </>
          )}
        </Card>
      )}

      {/* Parking Grid */}
      <ParkingGrid
        layout={floorLayout}
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
        <View style={styles.extraLegend}>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>⬇️</Text>
            <Text style={styles.legendText}>Lối vào</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>⬆️</Text>
            <Text style={styles.legendText}>Lối ra</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#E0E0E0' }]} />
            <Text style={styles.legendText}>Đường đi</Text>
          </View>
        </View>
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

            {floorLayout.entries.map((entry, index) => (
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
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  infoButton: {
    padding: SPACING.xs,
  },
  infoCard: {
    margin: SPACING.md,
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
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  legendContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  extraLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendIcon: {
    fontSize: 16,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textPrimary,
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
