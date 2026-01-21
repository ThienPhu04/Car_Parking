import { useState, useEffect, useCallback } from 'react';
import { CellType, ParkingSlot, SlotStatus } from '../../../types/parking.types';
import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import { slotHelper } from '../../../shared/utils/slotHelper';

export const mockParkingSlots = (floor: number): ParkingSlot[] => [
  {
    id: 'slot_1',
    code: 'A1',
    floor,
    x: 3,
    y: 4,
    type: CellType.SLOT,
    status: SlotStatus.AVAILABLE,
    walkable: false,
    features: ['near_elevator'],
  },
  {
    id: 'slot_2',
    code: 'A2',
    floor,
    x: 3,
    y: 6,
    type: CellType.SLOT,
    status: SlotStatus.OCCUPIED,
    walkable: false,
  },
  {
    id: 'slot_3',
    code: 'A3',
    floor,
    x: 3,
    y: 8,
    type: CellType.SLOT,
    status: SlotStatus.RESERVED,
    walkable: false,
    reservedBy: 'user_123',
    reservedUntil: '2026-01-20T10:00:00Z',
  },
  {
    id: 'slot_4',
    code: 'B1',
    floor,
    x: 9,
    y: 4,
    type: CellType.SLOT,
    status: SlotStatus.AVAILABLE,
    walkable: false,
    features: ['ev_charging'],
  },
  {
    id: 'slot_5',
    code: 'B2',
    floor,
    x: 9,
    y: 6,
    type: CellType.SLOT,
    status: SlotStatus.AVAILABLE,
    walkable: false,
  },
];


export const useParkingSlots = (lotId: string, floor: number) => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // const fetchSlots = useCallback(async () => {
  //   try {
  //     setIsLoading(true);
  //     setError(null);
  //     const response = await apiClient.get<ParkingSlot[]>(ENDPOINTS.GET_SLOTS(lotId, floor));
  //     setSlots(response.data);
  //   } catch (err) {
  //     setError(err as Error);
  //     console.error('Error fetching slots:', err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [lotId, floor]);


  const fetchSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ⏱ giả lập delay như gọi API
      await new Promise(resolve => setTimeout(resolve, 800));

      // ✅ mock data
      const data = mockParkingSlots(floor);
      setSlots(data);

    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [floor]);

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