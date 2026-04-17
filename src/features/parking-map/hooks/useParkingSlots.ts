import { useState, useEffect, useCallback } from 'react';
import {
  ParkingSlot,
  SlotStatus,
  ParkingMapDTO,
  ParkingMapResponseDTO,
} from '../../../types/parking.types';
import { slotHelper } from '../../../shared/utils/slotHelper';
import { parkingService } from '../services/parkingService';
import { ParkingMapTransformer } from '../ultils/parkingMapTransformer';

const resolveParkingFromResponse = (
  payload: ParkingMapResponseDTO,
  parkingCode: string,
): ParkingMapDTO | null => {
  const list = Array.isArray(payload) ? payload : [payload];
  if (list.length === 0) {
    return null;
  }

  return (
    list.find(item => item?.code === parkingCode)
    ?? list.find(item => Array.isArray(item?.floors) && item.floors.length > 0)
    ?? list[0]
  );
};

const toError = (err: unknown): Error => {
  if (err instanceof Error) {
    return err;
  }

  if (typeof err === 'object' && err !== null && 'message' in err) {
    return new Error(String((err as { message?: unknown }).message ?? 'Unknown error'));
  }

  return new Error(String(err));
};

export const useParkingSlots = (parkingCode: string, floorLevel: number) => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      if (!parkingCode) {
        setSlots([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await parkingService.getParkingMap({ parkingCode });

      console.log(
        `[useParkingSlots] raw getParkingMap response for ${parkingCode}:`,
        JSON.stringify(response, null, 2),
      );

      const rawPayload: any = response?.data;
      const payload: any = rawPayload?.data ?? rawPayload;

      console.log(
        `[useParkingSlots] normalized payload for ${parkingCode}:`,
        JSON.stringify(payload, null, 2),
      );

      const parkingDto = resolveParkingFromResponse(payload, parkingCode);
      if (!parkingDto) {
        console.log(
          `[useParkingSlots] no parking DTO found for parkingCode=${parkingCode}`,
        );
        setSlots([]);
        return;
      }

      const transformedMap = ParkingMapTransformer.transformParkingMap(parkingDto);
      const targetLayout = transformedMap.layouts.find(
        layout => layout.floorLevel === floorLevel,
      );

      console.log('[useParkingSlots] parking DTO summary:', {
        requestedParkingCode: parkingCode,
        resolvedParkingCode: parkingDto.code,
        requestedFloorLevel: floorLevel,
        availableFloors: transformedMap.layouts.map(layout => ({
          floorId: layout.floorId,
          floorLevel: layout.floorLevel,
          slotCount: layout.slots.length,
        })),
      });

      console.log(
        `[useParkingSlots] slots used by SearchScreen for ${parkingCode} floor ${floorLevel}:`,
        JSON.stringify(targetLayout?.slots ?? [], null, 2),
      );

      setSlots(targetLayout?.slots ?? []);
    } catch (err) {
      console.error('[useParkingSlots] Error fetching slots:', err);
      setError(toError(err));
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [floorLevel, parkingCode]);

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
