import { useState, useCallback, useMemo } from 'react';
import { ParkingSlot, SlotStatus } from '../../../types/parking.types';
import { useDebounce } from '../../../shared/hooks/useDebounce';

interface SearchFilters {
  floor?: number;
  features?: string[];
  status?: SlotStatus;
}

export const useSlotSearch = (slots: ParkingSlot[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const debouncedQuery = useDebounce(searchQuery, 300);

  const filteredSlots = useMemo(() => {
    let results = [...slots];

    // Filter by search query (slot code)
    if (debouncedQuery) {
      results = results.filter(slot =>
        slot.code.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }

    // Filter by floor
    if (filters.floor !== undefined) {
      results = results.filter(slot => slot.floor === filters.floor);
    }

    // Filter by features
    if (filters.features && filters.features.length > 0) {
      results = results.filter(slot =>
        filters.features!.some(feature => slot.features?.includes(feature as any))
      );
    }

    // Filter by status
    if (filters.status) {
      results = results.filter(slot => slot.status === filters.status);
    }

    // Sort by availability
    results.sort((a, b) => {
      if (a.status === SlotStatus.AVAILABLE && b.status !== SlotStatus.AVAILABLE) {
        return -1;
      }
      if (a.status !== SlotStatus.AVAILABLE && b.status === SlotStatus.AVAILABLE) {
        return 1;
      }
      return 0;
    });

    return results;
  }, [slots, debouncedQuery, filters]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilters,
    clearFilters,
    filteredSlots,
  };
};