import { FloorLayout, ParkingMap, SlotStatus } from "@app-types/parking.types";
import { parkingService } from "../services/parkingService";
import { ParkingMapTransformer } from "../ultils/parkingMapTransformer";
import { useCallback, useEffect, useState } from "react";

export const useParkingMap = (parkingCode: string) => {
  const [parkingMap, setParkingMap] = useState<ParkingMap | null>(null);
  const [currentLayout, setCurrentLayout] = useState<FloorLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load parking map data
  const loadParkingMap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await parkingService.getParkingMap(parkingCode);
      const transformedMap = ParkingMapTransformer.transformParkingMap(response.data);
      
      setParkingMap(transformedMap);
      
      // Set layout mặc định là tầng đầu tiên
      if (transformedMap.layouts.length > 0) {
        setCurrentLayout(transformedMap.layouts[0]);
      }
    } catch (err) {
      console.error('Error loading parking map:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [parkingCode]);

  // Switch floor
  const switchFloor = useCallback((floorLevel: number) => {
    if (!parkingMap) return;

    const layout = parkingMap.layouts.find(l => l.floorLevel === floorLevel);
    if (layout) {
      setCurrentLayout(layout);
    }
  }, [parkingMap]);

  // Update slot status (real-time)
  const updateSlotStatus = useCallback((
    slotCode: string,
    newStatus: SlotStatus,
    newStatusName: string
  ) => {
    if (!currentLayout) return;

    const updatedLayout = ParkingMapTransformer.updateSlotStatus(
      currentLayout,
      slotCode,
      newStatus,
      newStatusName
    );

    setCurrentLayout(updatedLayout);

    // Cập nhật trong parkingMap
    if (parkingMap) {
      const updatedLayouts = parkingMap.layouts.map(layout =>
        layout.floorId === updatedLayout.floorId ? updatedLayout : layout
      );

      setParkingMap({
        ...parkingMap,
        layouts: updatedLayouts,
      });
    }
  }, [currentLayout, parkingMap]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadParkingMap();
  }, [loadParkingMap]);

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
    refresh,
  };
};
