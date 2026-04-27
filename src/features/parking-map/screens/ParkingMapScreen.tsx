import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { Card } from '../../../shared/components/Card';
import { COLORS } from '../../../shared/constants/colors';
import { MQTT_TOPICS } from '../../../shared/constants/mqttTopics';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';
import { MainStackParamList } from '../../../types/navigation.types';
import {
  CellType,
  NavigationRoute,
  ParkingSlot,
  Position,
  SlotStatus,
} from '../../../types/parking.types';
import { EnhancedParkingGrid } from '../components/EnhancedParkingGrid';
import { FloorSelector } from '../components/FloorSelector';
import { NavigationPanel } from '../components/NavigationPanel';
import { SlotActionModal } from '../components/SlotActionModal';
import { SlotLegend } from '../components/SlotLegend';
import { useMQTT } from '../hooks/useMQTT';
import { useParkingMap } from '../hooks/useParkingMap';
import { ParkingNavigator } from '../ultils/navigationHelper';

type ParkingMapRouteProp = RouteProp<MainStackParamList, 'ParkingMap'>;

const toValidDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const isSameCalendarDay = (firstDate: Date, secondDate: Date) =>
  firstDate.getFullYear() === secondDate.getFullYear()
  && firstDate.getMonth() === secondDate.getMonth()
  && firstDate.getDate() === secondDate.getDate();

const ParkingMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ParkingMapRouteProp>();
  const parkingCode = route.params?.parkingCode ?? 'PK001';

  const requestedArrivalTime = toValidDate(route.params?.expectedArrivalTime);
  const requestedLeaveTime = toValidDate(route.params?.expectedLeaveTime);
  const shouldUseRealtime = !requestedArrivalTime
    || isSameCalendarDay(requestedArrivalTime, new Date());

  const {
    parkingMap,
    currentLayout,
    isLoading,
    error,
    switchFloor,
    updateSlotStatus,
    refresh,
  } = useParkingMap(
    parkingCode,
    shouldUseRealtime
      ? {}
      : {
          expectedArrivalTime: requestedArrivalTime?.toISOString(),
          expectedLeaveTime: requestedLeaveTime?.toISOString(),
        },
  );

  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [navRoute, setNavRoute] = useState<NavigationRoute | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showSlotActionModal, setShowSlotActionModal] = useState(false);

  const statusLabel = (status: number) => {
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

  const mqttTopic = currentLayout
    ? MQTT_TOPICS.SLOT_STATUS(parkingCode, currentLayout.floorLevel)
    : '';
  const { isConnected } = useMQTT(mqttTopic, message => {
    updateSlotStatus(
      message.slotId,
      message.status as SlotStatus,
      statusLabel(message.status),
    );
  });

  const currentFloorInfo =
    parkingMap?.floors.find(floor => floor.id === currentLayout?.floorId)
    ?? parkingMap?.floors[0];

  useEffect(() => {
    if (!route.params?.selectedSlot || !currentLayout) {
      return;
    }

    const matchedSlot = currentLayout.slots.find(
      slot =>
        slot.id === route.params?.selectedSlot
        || slot.code === route.params?.selectedSlot,
    );

    if (matchedSlot) {
      setSelectedSlot(matchedSlot);
    }
  }, [currentLayout, route.params?.selectedSlot]);

  const findNearestRoad = useCallback(
    (position: Position): Position | null => {
      if (!currentLayout) {
        return null;
      }

      let bestPosition: Position | null = null;
      let minimumDistance = Infinity;

      currentLayout.cells.forEach((row, y) =>
        row.forEach((cell, x) => {
          if (cell.type === CellType.ROAD || cell.type === CellType.ENTRY) {
            const distance = Math.abs(x - position.x) + Math.abs(y - position.y);
            if (distance < minimumDistance) {
              minimumDistance = distance;
              bestPosition = { x, y };
            }
          }
        }),
      );

      return bestPosition;
    },
    [currentLayout],
  );

  const findSlotAccessPoint = useCallback(
    (slot: ParkingSlot): Position | null => {
      if (!currentLayout) {
        return null;
      }

      const adjacentDirections = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
      ];

      for (const direction of adjacentDirections) {
        const nextX = slot.x + direction.x;
        const nextY = slot.y + direction.y;
        const nextCell = currentLayout.cells[nextY]?.[nextX];

        if (
          nextCell
          && (nextCell.type === CellType.ROAD
            || nextCell.type === CellType.ENTRY
            || nextCell.type === CellType.EXIT)
        ) {
          return { x: nextX, y: nextY };
        }
      }

      return findNearestRoad({ x: slot.x, y: slot.y });
    },
    [currentLayout, findNearestRoad],
  );

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
    if (!selectedSlot) {
      return;
    }

    setShowSlotActionModal(false);
    (navigation as any).navigate('MainTabs', {
      screen: 'Booking',
      params: {
        vehicleId: route.params?.vehicleId,
        expectedArrivalTime: requestedArrivalTime?.toISOString(),
      },
    });
  }, [
    navigation,
    requestedArrivalTime,
    route.params?.vehicleId,
    selectedSlot,
  ]);

  const handleFindRoute = useCallback(
    (entryIndex = 0) => {
      if (!selectedSlot || !currentLayout) {
        return;
      }

      const entry = currentLayout.entries[entryIndex];
      if (!entry) {
        Alert.alert('Lỗi', 'Không tìm thấy lối vào');
        return;
      }

      setShowEntryModal(false);
      const slotAccessPoint = findSlotAccessPoint(selectedSlot);
      if (!slotAccessPoint) {
        Alert.alert('Lỗi', 'Không thể tìm đường');
        return;
      }

      const routePath = new ParkingNavigator(currentLayout.lanes).findPath(
        { x: entry.x, y: entry.y },
        slotAccessPoint,
      );

      if (!routePath) {
        Alert.alert('Lỗi', 'Không tìm thấy đường đi');
        return;
      }

      routePath.path.push({ x: selectedSlot.x, y: selectedSlot.y });
      setNavRoute(routePath);
    },
    [currentLayout, findSlotAccessPoint, selectedSlot],
  );

  const handleClearRoute = useCallback(() => {
    setNavRoute(null);
    setSelectedSlot(null);
    setShowSlotActionModal(false);
  }, []);

  const handleFloorChange = useCallback(
    (floorId: string) => {
      if (!parkingMap) {
        return;
      }

      switchFloor(floorId);
      setSelectedSlot(null);
      setNavRoute(null);
      setShowSlotActionModal(false);
    },
    [parkingMap, switchFloor],
  );

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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {parkingMap.name || `Bãi xe ${parkingCode}`}
            </Text>
            {!!parkingMap.location && (
              <Text style={styles.headerSub} numberOfLines={1}>
                {parkingMap.location}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          {navRoute && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleClearRoute}>
              {/* <Icon name="close-circle" size={24} color={COLORS.error} /> */}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              Alert.alert(
                'Hướng dẫn',
                'Kéo 1 ngón để xoay bản đồ 3D\nDùng 2 ngón để di chuyển trái/phải/lên/xuống và chụm/mở để thu phóng\nXanh: Trống\nĐỏ: Đã có xe\nVàng: Đã đặt\nIN: Lối vào | OUT: Lối ra',
              )
            }
          >
          </TouchableOpacity>
        </View>
      </View>

      <FloorSelector
        selectedFloor={currentLayout?.floorId ?? parkingMap.floors[0]?.id ?? ''}
        onFloorChange={handleFloorChange}
        floors={parkingMap.floors}
      />


      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <StatChip
            icon="checkmark-circle"
            color={COLORS.success}
            label={`${currentFloorInfo?.availableSlots ?? 0} trống`}
          />
          <StatChip
            icon="car"
            color={COLORS.error}
            label={`${currentFloorInfo?.occupiedSlots ?? 0} có xe`}
          />
          <StatChip
            icon="time"
            color={COLORS.warning}
            label={`${currentFloorInfo?.reservedSlots ?? 0} đã đặt`}
          />
        </View>
      </Card>

      {selectedSlot && (
        <Card style={styles.infoCard}>
          <InfoRow
            icon="location"
            color={COLORS.primary}
            text={`${selectedSlot.name} (${selectedSlot.code})`}
          />
          <InfoRow
            icon="business"
            color={COLORS.textSecondary}
            text={`Khu: ${selectedSlot.zone}`}
          />
        </Card>
      )}

      <View style={styles.gridContainer}>
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
            <Text style={styles.loadingText}>Bãi xe chưa có sơ đồ tầng</Text>
          </View>
        )}
      </View>

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

      <Modal
        visible={showEntryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEntryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn lối vào</Text>
              <TouchableOpacity onPress={() => setShowEntryModal(false)}>
                <Icon name="close" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {(currentLayout?.entries ?? []).map((entry, index) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryRow}
                onPress={() => handleFindRoute(index)}
              >
                <Icon name="enter-outline" size={22} color={COLORS.success} />
                <Text style={styles.entryText}>{entry.name}</Text>
                <Icon
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const StatChip: React.FC<{ icon: string; color: string; label: string }> = ({
  icon,
  color,
  label,
}) => (
  <View style={styles.statChip}>
    <Icon name={icon} size={15} color={color} />
    <Text style={styles.statChipText}>{label}</Text>
  </View>
);

const InfoRow: React.FC<{ icon: string; color: string; text: string }> = ({
  icon,
  color,
  text,
}) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={16} color={color} />
    <Text style={styles.infoRowText} numberOfLines={1}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  retryBtn: {
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  iconBtn: {
    padding: SPACING.xs,
  },
  modeCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeText: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  statsCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  infoCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  infoRowText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  gridContainer: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
  },
  legendBar: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
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
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  entryText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
});

export default ParkingMapScreen;
