import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FloorLayout,
  ParkingMap,
  ParkingMapDTO,
  ParkingMapResponseDTO,
  SlotStatus,
} from '@app-types/parking.types';
import { parkingService, type GetParkingMapParams } from '../services/parkingService';
import { ParkingMapTransformer } from '../ultils/parkingMapTransformer';

const toError = (err: unknown): Error => {
  if (err instanceof Error) {
    return err;
  }

  if (typeof err === 'object' && err !== null && 'message' in err) {
    return new Error(String((err as { message?: unknown }).message ?? 'Unknown error'));
  }

  return new Error(String(err));
};

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

const normalizeParkingDto = (dto: ParkingMapDTO): ParkingMapDTO => {
  const floors = (dto.floors ?? []).map(floor => {
    const lanes = (floor.lanes ?? [])
      .map((lane: any) => {
        if (typeof lane?.positionX === 'number' && typeof lane?.positionY === 'number') {
          return {
            ...lane,
            witdh: typeof lane?.witdh === 'number'
              ? lane.witdh
              : (typeof lane?.laneWidth === 'number' ? lane.laneWidth : 40),
            height: typeof lane?.height === 'number'
              ? lane.height
              : (typeof lane?.laneWidth === 'number' ? lane.laneWidth : 40),
          };
        }

        const pts = lane?.points;
        if (!Array.isArray(pts) || pts.length < 4) return null;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < pts.length; i += 2) {
          const x = Number(pts[i]);
          const y = Number(pts[i + 1]);
          if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }

        if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;

        const thickness = typeof lane?.laneWidth === 'number'
          ? lane.laneWidth
          : (typeof lane?.witdh === 'number' ? lane.witdh : 40);
        const expand = Math.max(thickness, 10);

        return {
          ...lane,
          positionX: minX - expand / 2,
          positionY: minY - expand / 2,
          witdh: Math.max(maxX - minX, 1) + expand,
          height: Math.max(maxY - minY, 1) + expand,
          rotation: typeof lane?.rotation === 'number' ? lane.rotation : 0,
        };
      })
      .filter(Boolean);

    return { ...floor, lanes };
  });

  return { ...dto, floors };
};

type UseParkingMapFilters = Omit<GetParkingMapParams, 'parkingCode'>;

export const useParkingMap = (
  parkingCode: string,
  filters: UseParkingMapFilters = {},
) => {
  const {
    status,
    expectedArrivalTime,
    expectedLeaveTime,
  } = filters;
  const [parkingMap, setParkingMap] = useState<ParkingMap | null>(null);
  const [currentLayout, setCurrentLayout] = useState<FloorLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const layoutIndexRef = useRef<Map<string, FloorLayout>>(new Map());

  const loadParkingMap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await parkingService.getParkingMap({
        parkingCode,
        status,
        expectedArrivalTime,
        expectedLeaveTime,
      });
      console.log(
        '[useParkingMap] API response:',
        JSON.stringify(response, null, 2)
      );
      const rawPayload: any = response?.data;
      const payload: any = rawPayload?.data ?? rawPayload;
      const parkingDto = resolveParkingFromResponse(payload, parkingCode);
      if (!parkingDto) {
        throw new Error('Khong co du lieu bai xe tu API');
      }
      const normalized = normalizeParkingDto(parkingDto);
      const map = ParkingMapTransformer.transformParkingMap(normalized);
      setParkingMap(map);
      layoutIndexRef.current = new Map(map.layouts.map(layout => [layout.floorId, layout]));
      setCurrentLayout(map.layouts[0] ?? null);
    } catch (err) {
      console.error('[useParkingMap] Error:', err);
      setError(toError(err));
    } finally {
      setIsLoading(false);
    }
  }, [expectedArrivalTime, expectedLeaveTime, parkingCode, status]);

  const switchFloor = useCallback((floorId: string) => {
    const layout = layoutIndexRef.current.get(floorId);
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
    // Gọi lần đầu
    loadParkingMap();

    // Set interval 1 phút (60000 ms)
    const interval = setInterval(() => {
      loadParkingMap();
    }, 5000);

    // Cleanup khi unmount hoặc dependency change
    return () => clearInterval(interval);
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
