import { useState, useEffect, useCallback } from 'react';
import { ParkingSlot, SlotStatus } from '../../../types/parking.types';
import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { slotHelper } from '../../../shared/utils/slotHelper';

export const useParkingSlots = (lotId: string, floor: number) => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<ParkingSlot[]>(ENDPOINTS.GET_SLOTS(lotId, floor));
      setSlots(response.data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching slots:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lotId, floor]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const getAvailableSlots = useCallback(() => {
    return slotHelper.getAvailableSlots(slots);
  }, [slots]);

  const getNearestSlot = useCallback((position: { x: number; y: number }) => {
    return slotHelper.getNearestSlot(slots, position);
  }, [slots]);

  const getSlotById = useCallback((id: string) => {
    return slotHelper.getSlotById(slots, id);
  }, [slots]);

  const updateSlotStatus = useCallback((slotId: string, status: SlotStatus) => {
    setSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId ? { ...slot, status } : slot
      )
    );
  }, []);

  return {
    slots,
    isLoading,
    error,
    fetchSlots,
    getAvailableSlots,
    getNearestSlot,
    getSlotById,
    updateSlotStatus,
  };
};