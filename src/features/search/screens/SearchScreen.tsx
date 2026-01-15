import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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

  const [showFilters, setShowFilters] = useState(false);

  const handleSlotSelect = (slot: ParkingSlot) => {
    if (slot.status === SlotStatus.AVAILABLE) {
      (navigation as any).navigate('ParkingMap' as any, { selectedSlot: slot.id });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Tìm kiếm chỗ đỗ</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm theo mã chỗ (VD: A1, B2...)"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon
            name={showFilters ? 'close' : 'filter'}
            size={24}
            color={COLORS.primary}
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

      <View style={styles.resultHeader}>
        <Text style={styles.resultText}>
          {filteredSlots.length} kết quả
        </Text>
        {(searchQuery || Object.keys(filters).length > 0) && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              clearFilters();
            }}
          >
            <Text style={styles.clearText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredSlots.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Không tìm thấy kết quả"
          description="Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  resultText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  clearText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
});

export default SearchScreen;