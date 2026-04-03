import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { COLORS } from '../../../shared/constants/colors';
import { SearchBar } from '../components/SearchBar';
import { FilterOptions } from '../components/FilterOptions';
import { SlotSuggestions } from '../components/SlotSuggestions';
import { useSlotSearch } from '../hooks/useSlotSearch';
import { useParkingSlots } from '../../parking-map/hooks/useParkingSlots';
import { ParkingSlot, SlotStatus } from '../../../types/parking.types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { SPACING } from '../../../shared/constants/spacing';
import { TYPOGRAPHY } from '../../../shared/constants/typography';

const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const initialQuery = route.params?.query || '';
  
  const lotId = 'lot_001';
  const { slots } = useParkingSlots(lotId, 1);

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

  const [showFilters, setShowFilters] = useState(false);

  const handleSlotSelect = (slot: ParkingSlot) => {
    if (slot.status === SlotStatus.AVAILABLE) {
      (navigation as any).navigate('ParkingMap', { selectedSlot: slot.id });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Tìm chỗ đỗ</Text>
        <Text style={styles.subtitle}>
          Nhập mã chỗ hoặc sử dụng bộ lọc
        </Text>
      </View>

      {/* SEARCH AREA */}
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
              color={showFilters ? '#fff' : COLORS.primary}
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

      {/* RESULT HEADER */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultText}>
          {filteredSlots.length} chỗ phù hợp
        </Text>

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

      {/* RESULT LIST */}
      {filteredSlots.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Không tìm thấy"
          description="Thử thay đổi từ khóa hoặc bộ lọc"
        />
      ) : (
        <FlatList
          data={filteredSlots}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SlotSuggestions
              slot={item}
              onPress={() => handleSlotSelect(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    backgroundColor: '#fff',
    borderRadius: 14,

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
    marginBottom: SPACING.xs,
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

  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 120,
  },
});