import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FloorLayout,
  ParkingMap,
  ParkingMapDTO,
  ParkingMapResponseDTO,
  SlotStatus,
} from '@app-types/parking.types';
import { parkingService } from '../services/parkingService';
import { ParkingMapTransformer } from '../ultils/parkingMapTransformer';

const resolveParkingFromResponse = (
  payload: ParkingMapResponseDTO,
  parkingCode: string,
): ParkingMapDTO | null => {
  const list = Array.isArray(payload) ? payload : [payload];
  if (list.length === 0) return null;

  return (
    list.find(item => item?.code === parkingCode)
    ?? list.find(item => Array.isArray(item?.floors) && item.floors.length > 0)
    ?? list[0]
  );
};

export const useParkingMap = (parkingCode: string) => {
  const [parkingMap, setParkingMap] = useState<ParkingMap | null>(null);
  const [currentLayout, setCurrentLayout] = useState<FloorLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mapRef = useRef<ParkingMap | null>(null);
  mapRef.current = parkingMap;

  const loadParkingMap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await parkingService.getParkingMap(parkingCode);
      const parkingDto = resolveParkingFromResponse(response.data, parkingCode);
      if (!parkingDto) {
        throw new Error('Khong co du lieu bai xe tu API');
      }
      console.log(
        '[useParkingMap] Fetched parking DTO:\n',
        JSON.stringify(parkingDto, null, 2)
      );
      const map = ParkingMapTransformer.transformParkingMap(parkingDto);
      setParkingMap(map);


      const firstFloorId = map.floors[0]?.id;
      const defaultLayout = map.layouts.find(item => item.floorId === firstFloorId)
        ?? map.layouts[0]
        ?? null;
      setCurrentLayout(defaultLayout);
    } catch (err) {
      console.error('[useParkingMap] Error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [parkingCode]);

  const switchFloor = useCallback((floorId: string) => {
    const map = mapRef.current;
    if (!map) return;

    const layout = map.layouts.find(item => item.floorId === floorId);
    if (layout) setCurrentLayout(layout);
  }, []);

  const updateSlotStatus = useCallback((
    slotCode: string,
    newStatus: SlotStatus,
    newStatusName: string,
  ) => {
    setCurrentLayout(prev =>
      prev ? ParkingMapTransformer.updateSlotStatus(prev, slotCode, newStatus, newStatusName) : prev,
    );

    setParkingMap(prev =>
      prev ? {
        ...prev,
        layouts: prev.layouts.map(layout =>
          ParkingMapTransformer.updateSlotStatus(layout, slotCode, newStatus, newStatusName),
        ),
      } : prev,
    );
  }, []);

  useEffect(() => {
    loadParkingMap();
  }, [loadParkingMap]);

  return {
    parkingMap,
    currentLayout,
    isLoading,
    error,
    switchFloor,
    updateSlotStatus,
    refresh: loadParkingMap,
  };
};
