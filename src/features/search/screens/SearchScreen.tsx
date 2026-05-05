import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { COLORS } from '../../../shared/constants/colors';
import { useSlotSearch } from '../hooks/useSlotSearch';
import { useParkingSlots } from '../../parking-map/hooks/useParkingSlots';
import { ParkingSlot, SlotStatus } from '../../../types/parking.types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

type ZoneGroup = {
  zone: string;
  slots: ParkingSlot[];
};

const ZONE_SLOT_COLUMNS = 4;
const ZONE_SLOT_GAP = SPACING.sm;
const ZONE_VISIBLE_ROWS = 4;
const ZONE_SLOT_VERTICAL_PADDING = 16;

const normalizeZoneName = (zone?: string) => {
  const trimmed = zone?.trim();
  if (!trimmed) {
    return 'Khác';
  }

  return trimmed;
};

const getZoneSortKey = (zone: string) =>
  normalizeZoneName(zone)
    .replace(/^khu\s+/i, '')
    .trim()
    .toUpperCase();

const compareAlphaNumeric = (left: string, right: string) =>
  left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: 'base',
  });

const formatZoneLabel = (zone: string) => {
  const normalizedZone = normalizeZoneName(zone);
  if (/^khu\s+/i.test(normalizedZone)) {
    return normalizedZone;
  }

  return `Khu ${normalizedZone}`;
};

const getSlotStatusStyle = (status: SlotStatus) => {
  switch (status) {
    case SlotStatus.AVAILABLE:
      return {
        backgroundColor: COLORS.available,
        textColor: COLORS.white,
      };
    case SlotStatus.OCCUPIED:
      return {
        backgroundColor: COLORS.occupied,
        textColor: COLORS.white,
      };
    case SlotStatus.RESERVED:
      return {
        backgroundColor: '#E8D400',
        textColor: COLORS.white,
      };
    default:
      return {
        backgroundColor: COLORS.borderLight,
        textColor: COLORS.textPrimary,
      };
  }
};

const SearchScreen: React.FC = () => {
  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialQuery = route.params?.query || '';
  const parkingCode = route.params?.parkingCode ?? 'PK001';
  const selectedFloor = 1;
  const { slots, isLoading, error } = useParkingSlots(parkingCode, selectedFloor);

  const { searchQuery, setSearchQuery, filteredSlots } = useSlotSearch(slots);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery, setSearchQuery]);

  useEffect(() => {
    console.log('[SearchScreen] debug snapshot:', {
      parkingCode,
      selectedFloor,
      searchQuery,
      slotCount: slots.length,
      filteredSlotCount: filteredSlots.length,
      errorMessage: error?.message ?? null,
      isLoading,
    });
  }, [
    error,
    filteredSlots.length,
    isLoading,
    parkingCode,
    searchQuery,
    selectedFloor,
    slots.length,
  ]);

  const [zoneGridWidth, setZoneGridWidth] = useState(0);

  const zoneGroups = useMemo<ZoneGroup[]>(() => {
    const groups = filteredSlots.reduce<Record<string, ParkingSlot[]>>((acc, slot) => {
      const zoneName = normalizeZoneName(slot.zone);
      if (!acc[zoneName]) {
        acc[zoneName] = [];
      }
      acc[zoneName].push(slot);
      return acc;
    }, {});

    return Object.entries(groups)
      .sort(([zoneA], [zoneB]) =>
        compareAlphaNumeric(getZoneSortKey(zoneA), getZoneSortKey(zoneB)),
      )
      .map(([zone, zoneSlots]) => ({
        zone,
        slots: [...zoneSlots].sort((a, b) => compareAlphaNumeric(a.code, b.code)),
      }));
  }, [filteredSlots]);

  const handleSlotSelect = (slot: ParkingSlot) => {
    if (slot.status === SlotStatus.AVAILABLE) {
      (navigation as any).navigate('ParkingMap', { selectedSlot: slot.id });
    }
  };

  const slotPillWidth = useMemo(() => {
    if (zoneGridWidth <= 0) {
      const estimatedPanelWidth = windowWidth - (SPACING.md * 2) - (SPACING.md * 2) - 2;
      return Math.max(
        (estimatedPanelWidth - ZONE_SLOT_GAP * (ZONE_SLOT_COLUMNS - 1)) / ZONE_SLOT_COLUMNS,
        58,
      );
    }

    return Math.max(
      (zoneGridWidth - ZONE_SLOT_GAP * (ZONE_SLOT_COLUMNS - 1)) / ZONE_SLOT_COLUMNS,
      58,
    );
  }, [windowWidth, zoneGridWidth]);

  const renderZonePanel = () => (
    <View style={styles.zonePanel}>
      <View style={styles.zonePanelHeader}>
        <View style={styles.zonePanelTitleBlock}>
          <Text style={styles.zonePanelTitle}>Danh sách vị trí bãi xe</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.available }]} />
              <Text style={styles.legendText}>Trống</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.occupied }]} />
              <Text style={styles.legendText}>Có xe</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E8D400' }]} />
              <Text style={styles.legendText}>Đã đặt chỗ</Text>
            </View>
          </View>
        </View>

        <View style={styles.floorBadge}>
          <Text style={styles.floorBadgeText}>Tầng {selectedFloor}</Text>
          <Icon name="chevron-down-outline" size={16} color={COLORS.textSecondary} />
        </View>
      </View>

      {zoneGroups.length === 0 ? (
        <View style={styles.zoneEmptyState}>
          <Text style={styles.zoneEmptyText}>
            Không có vị trí phù hợp với từ khóa tìm kiếm hiện tại.
          </Text>
        </View>
      ) : (
        zoneGroups.map(group => (
          <View key={group.zone} style={styles.zoneGroup}>
            <Text style={styles.zoneGroupTitle}>{formatZoneLabel(group.zone)}</Text>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={group.slots.length > 20}
              style={
                group.slots.length > ZONE_SLOT_COLUMNS * ZONE_VISIBLE_ROWS
                  ? styles.zoneSlotScroll
                  : undefined
              }
              contentContainerStyle={styles.zoneSlotScrollContent}
            >
              <View
                style={styles.slotGrid}
                onLayout={event => {
                  const nextWidth = event.nativeEvent.layout.width;
                  if (Math.abs(nextWidth - zoneGridWidth) > 1) {
                    setZoneGridWidth(nextWidth);
                  }
                }}
              >
                {group.slots.map(slot => {
                  const slotStatusStyle = getSlotStatusStyle(slot.status);

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotPill,
                        { width: slotPillWidth },
                        { backgroundColor: slotStatusStyle.backgroundColor },
                      ]}
                      activeOpacity={slot.status === SlotStatus.AVAILABLE ? 0.8 : 1}
                      disabled={slot.status !== SlotStatus.AVAILABLE}
                      onPress={() => handleSlotSelect(slot)}
                    >
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[
                          styles.slotPillText,
                          { color: slotStatusStyle.textColor },
                        ]}
                      >
                        {slot.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Tìm chỗ đỗ xe</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultText}>{filteredSlots.length} chỗ phù hợp</Text>

          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>Xóa tìm kiếm</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {filteredSlots.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="Không tìm thấy"
            description="Thử lại với từ khóa khác"
          />
        ) : (
          renderZonePanel()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchSection: {
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  resultText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  clearText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  zonePanel: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  zonePanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  zonePanelTitleBlock: {
    flex: 1,
  },
  zonePanelTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  legendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  floorBadge: {
    minWidth: 104,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  floorBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  zoneEmptyState: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  zoneEmptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  zoneGroup: {
    marginTop: SPACING.md,
  },
  zoneGroupTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  zoneSlotScroll: {
    maxHeight:
      (TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.normal + ZONE_SLOT_VERTICAL_PADDING)
      * ZONE_VISIBLE_ROWS
      + ZONE_SLOT_GAP * (ZONE_VISIBLE_ROWS - 1),
  },
  zoneSlotScrollContent: {
    paddingRight: SPACING.xs,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'flex-start',
  },
  slotPill: {
    minWidth: 0,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPillText: {
    width: '100%',
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  scrollContent: {
    paddingBottom: 120,
  },
});
