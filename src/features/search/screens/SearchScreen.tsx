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
import { SearchBar } from '../components/SearchBar';
import { FilterOptions } from '../components/FilterOptions';
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
    return 'Khac';
  }

  return trimmed;
};

const getZoneSortKey = (zone: string) =>
  normalizeZoneName(zone)
    .replace(/^khu\s+/i, '')
    .trim()
    .toUpperCase();

const formatZoneLabel = (zone: string) => {
  const normalizedZone = normalizeZoneName(zone);
  if (/^khu\s+/i.test(normalizedZone)) {
    return normalizedZone;
  }

  return ` ${normalizedZone}`;
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

  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilters,
    clearFilters,
    filteredSlots,
  } = useSlotSearch(slots);

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
      filters,
      slotCount: slots.length,
      filteredSlotCount: filteredSlots.length,
      errorMessage: error?.message ?? null,
      isLoading,
    });

    console.log(
      '[SearchScreen] slots currently rendered:',
      JSON.stringify(slots, null, 2),
    );

    console.log(
      '[SearchScreen] filtered slots currently rendered:',
      JSON.stringify(filteredSlots, null, 2),
    );
  }, [
    error,
    filteredSlots,
    filters,
    isLoading,
    parkingCode,
    searchQuery,
    selectedFloor,
    slots,
  ]);

  const [showFilters, setShowFilters] = useState(false);
  const [zoneGridWidth, setZoneGridWidth] = useState(0);

  const zoneOptions = useMemo(() => {
    return Array.from(
      new Set(slots.map(slot => normalizeZoneName(slot.zone))),
    ).sort((a, b) => getZoneSortKey(a).localeCompare(getZoneSortKey(b)));
  }, [slots]);

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
        getZoneSortKey(zoneA).localeCompare(getZoneSortKey(zoneB)),
      )
      .map(([zone, zoneSlots]) => ({
        zone,
        slots: [...zoneSlots].sort((a, b) => a.code.localeCompare(b.code)),
      }));
  }, [filteredSlots]);

  const zoneSummary = useMemo(() => {
    return slots.reduce<Record<string, number>>((acc, slot) => {
      const zoneName = normalizeZoneName(slot.zone);
      acc[zoneName] = (acc[zoneName] || 0) + 1;
      return acc;
    }, {});
  }, [slots]);

  const handleSlotSelect = (slot: ParkingSlot) => {
    if (slot.status === SlotStatus.AVAILABLE) {
      (navigation as any).navigate('ParkingMap', { selectedSlot: slot.id });
    }
  };

  const handleZonePress = (zone: string) => {
    updateFilters({
      zone: filters.zone === zone ? undefined : zone,
    });
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
              <Text style={styles.legendText}>Trong</Text>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.zoneFilterContent}
        style={styles.zoneFilterScroll}
      >
        <TouchableOpacity
          style={[
            styles.zoneFilterChip,
            !filters.zone && styles.zoneFilterChipActive,
          ]}
          onPress={() => updateFilters({ zone: undefined })}
        >
          <Text
            style={[
              styles.zoneFilterText,
              !filters.zone && styles.zoneFilterTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>

        {zoneOptions.map(zone => (
          <TouchableOpacity
            key={zone}
            style={[
              styles.zoneFilterChip,
              filters.zone === zone && styles.zoneFilterChipActive,
            ]}
            onPress={() => handleZonePress(zone)}
          >
            <Text
              style={[
                styles.zoneFilterText,
                filters.zone === zone && styles.zoneFilterTextActive,
              ]}
            >
              {formatZoneLabel(zone)} ({zoneSummary[zone] || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {zoneGroups.length === 0 ? (
        <View style={styles.zoneEmptyState}>
          <Text style={styles.zoneEmptyText}>Không có vị trí phù hợp với bộ lọc hiện tại.</Text>
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
        <Text style={styles.subtitle}>Nhập mã chỗ hoặc sử dụng bộ lọc</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="VD: A1, B2..."
          />

          <TouchableOpacity
            style={[
              styles.filterButton,
              showFilters && styles.filterButtonActive,
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Icon
              name="options-outline"
              size={20}
              color={showFilters ? COLORS.white : COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <FilterOptions
            filters={filters}
            onUpdateFilters={updateFilters}
            onClearFilters={clearFilters}
          />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultText}>{filteredSlots.length} chỗ phù hợp</Text>

          {(searchQuery || Object.keys(filters).length > 0) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                clearFilters();
              }}
            >
              <Text style={styles.clearText}>Xóa lọc</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredSlots.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="Không tìm thấy"
            description="Thử lại với từ khóa hoặc bộ lọc khác"
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
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
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
  zoneFilterScroll: {
    marginTop: SPACING.md,
  },
  zoneFilterContent: {
    paddingRight: SPACING.sm,
    gap: SPACING.sm,
  },
  zoneFilterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  zoneFilterChipActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  zoneFilterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  zoneFilterTextActive: {
    color: COLORS.primary,
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
