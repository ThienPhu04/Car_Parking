import { useState, useEffect, useCallback } from 'react';
import { ParkingSlot, SlotStatus } from '../../../types/parking.types';
import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { slotHelper } from '../../../shared/utils/slotHelper';

export const mockParkingSlots = (floor: number): ParkingSlot[] => [
  {
    id: '1',
    code: 'A1',
    floor,
    status: SlotStatus.AVAILABLE,
    position: { x: 10, y: 20 },
    features: ['near_elevator'],
  },
  {
    id: '2',
    code: 'A2',
    floor,
    status: SlotStatus.OCCUPIED,
    position: { x: 20, y: 20 },
  },
  {
    id: '3',
    code: 'B1',
    floor,
    status: SlotStatus.RESERVED,
    position: { x: 10, y: 40 },
    reservedBy: 'user_123',
    reservedUntil: '2026-01-20T10:00:00Z',
  },
  {
    id: '4',
    code: 'B2',
    floor,
    status: SlotStatus.AVAILABLE,
    position: { x: 20, y: 40 },
    features: ['ev_charging', 'covered'],
  },
];

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