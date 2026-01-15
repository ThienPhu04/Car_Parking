import { useState, useCallback } from 'react';
import { storage } from '../../../shared/utils/storage';
import { CONFIG } from '../../../shared/constants/config';

interface CarLocation {
  slotId: string;
  slotCode: string;
  floor: number;
  position: { x: number; y: number };
  timestamp: string;
}

export const useCarLocation = () => {
  const [carLocation, setCarLocation] = useState<CarLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const saveCarLocation = useCallback(async (location: CarLocation) => {
    try {
      setIsLoading(true);
      await storage.setItem(CONFIG.STORAGE_KEYS.CAR_LOCATION, location);
      setCarLocation(location);
    } catch (error) {
      console.error('Error saving car location:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCarLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      const location = await storage.getItem<CarLocation>(
        CONFIG.STORAGE_KEYS.CAR_LOCATION
      );
      setCarLocation(location);
      return location;
    } catch (error) {
      console.error('Error getting car location:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCarLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      await storage.removeItem(CONFIG.STORAGE_KEYS.CAR_LOCATION);
      setCarLocation(null);
    } catch (error) {
      console.error('Error clearing car location:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    carLocation,
    isLoading,
    saveCarLocation,
    getCarLocation,
    clearCarLocation,
  };
};