import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Vehicle } from '../../../types/vehicle.types';
import { useAuth } from '../../../store/AuthContext';
import { storage } from '../../../shared/utils/storage';
import { CONFIG } from '../../../shared/constants/config';
import { vehicleService } from '../services/vehicleService';
import {
  buildVehicleName,
  normalizeVehicleList,
  normalizeVehicleResponse,
} from '../utils/vehicleAdapters';

const GUEST_VEHICLES_KEY = CONFIG.STORAGE_KEYS.GUEST_VEHICLES;

const createGuestVehicleId = () =>
  `guest-vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useProfile = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      if (user?.isGuest) {
        setIsLoading(true);
        setError(null);
        const guestVehicles = await storage.getItem<Vehicle[]>(GUEST_VEHICLES_KEY);
        setVehicles(Array.isArray(guestVehicles) ? guestVehicles : []);
        return;
      }

      if (!user?.code) {
        console.error('[useProfile] Missing user.code in Auth Context');
        Alert.alert(
          'Loi du lieu User',
          'Tai khoan dang dang nhap khong co ma nguoi dung (code). Vui long kiem tra du lieu dang nhap.',
        );
      }

      setIsLoading(true);
      setError(null);

      const response = await vehicleService.getVehicles({ userId: user?.code || '' });
      setVehicles(normalizeVehicleList(response.data));
    } catch (err) {
      setError(err as Error);
      console.error('[useProfile] Error fetching vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.code, user?.isGuest]);

  const addVehicle = useCallback(async (vehicle: Omit<Vehicle, 'id' | 'userId'>) => {
    try {
      if (user?.isGuest) {
        setIsLoading(true);
        setError(null);

        const createdVehicle: Vehicle = {
          ...vehicle,
          id: createGuestVehicleId(),
          userId: user.id || 'guest-local-user',
        };

        const nextVehicles = [...vehicles, createdVehicle];
        setVehicles(nextVehicles);
        await storage.setItem(GUEST_VEHICLES_KEY, nextVehicles);
        return createdVehicle;
      }

      if (!user?.code) {
        Alert.alert('Loi', 'Khong tim thay ma nguoi dung de gui len server.');
        throw new Error('Missing user code');
      }

      setIsLoading(true);
      setError(null);

      const payload = {
        userId: user.code,
        nameVehicles: buildVehicleName(vehicle.brand, vehicle.model),
        licensePlate: vehicle.licensePlate,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        type: vehicle.type,
        status: 1,
      };

      const response = await vehicleService.createVehicle(payload);
      const createdVehicle = normalizeVehicleResponse(response.data, {
        ...vehicle,
        id: '',
        userId: user.code,
      });

      if (createdVehicle?.id) {
        setVehicles(prevVehicles => {
          const existingVehicleIndex = prevVehicles.findIndex(
            currentVehicle => currentVehicle.id === createdVehicle.id,
          );

          if (existingVehicleIndex >= 0) {
            return prevVehicles.map(currentVehicle =>
              currentVehicle.id === createdVehicle.id ? createdVehicle : currentVehicle,
            );
          }

          return [...prevVehicles, createdVehicle];
        });
      } else {
        await fetchVehicles();
      }

      return createdVehicle;
    } catch (err) {
      setError(err as Error);
      console.error('[useProfile] Error creating vehicle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchVehicles, user?.code, user?.id, user?.isGuest, vehicles]);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle>) => {
    try {
      if (user?.isGuest) {
        setIsLoading(true);
        setError(null);

        const nextVehicles = vehicles.map(vehicle =>
          vehicle.id === id ? { ...vehicle, ...data } : vehicle,
        );

        setVehicles(nextVehicles);
        await storage.setItem(GUEST_VEHICLES_KEY, nextVehicles);
        return nextVehicles.find(vehicle => vehicle.id === id);
      }

      setIsLoading(true);
      setError(null);

      const currentVehicle = vehicles.find(vehicle => vehicle.id === id);
      const payload = {
        licensePlate: data.licensePlate,
        nameVehicles: buildVehicleName(data.brand, data.model),
        brand: data.brand,
        model: data.model,
        color: data.color,
        type: data.type,
      };

      const response = await vehicleService.updateVehicle(id, payload);
      const updatedVehicle = normalizeVehicleResponse(response.data, {
        ...currentVehicle,
        ...data,
        id,
      });

      if (updatedVehicle?.id) {
        setVehicles(prevVehicles =>
          prevVehicles.map(vehicle => (vehicle.id === id ? updatedVehicle : vehicle)),
        );
      } else {
        await fetchVehicles();
      }

      return updatedVehicle;
    } catch (err) {
      setError(err as Error);
      console.error('[useProfile] Error updating vehicle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchVehicles, user?.isGuest, vehicles]);

  const deleteVehicle = useCallback(async (id: string) => {
    try {
      if (user?.isGuest) {
        setIsLoading(true);
        setError(null);
        const nextVehicles = vehicles.filter(vehicle => vehicle.id !== id);
        setVehicles(nextVehicles);
        await storage.setItem(GUEST_VEHICLES_KEY, nextVehicles);
        return;
      }

      setIsLoading(true);
      setError(null);
      await vehicleService.deleteVehicle(id);
      setVehicles(prevVehicles => prevVehicles.filter(vehicle => vehicle.id !== id));
    } catch (err) {
      setError(err as Error);
      console.error('Error deleting vehicle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.isGuest, vehicles]);

  const setDefaultVehicle = useCallback(async (id: string) => {
    try {
      if (user?.isGuest) {
        setIsLoading(true);
        setError(null);
        const nextVehicles = vehicles.map(vehicle => ({
          ...vehicle,
          isDefault: vehicle.id === id,
        }));
        setVehicles(nextVehicles);
        await storage.setItem(GUEST_VEHICLES_KEY, nextVehicles);
        return;
      }

      setIsLoading(true);
      setError(null);
      await vehicleService.setDefaultVehicle(id);
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle => ({ ...vehicle, isDefault: vehicle.id === id })),
      );
    } catch (err) {
      setError(err as Error);
      console.error('Error setting default vehicle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.isGuest, vehicles]);

  return {
    user,
    vehicles,
    isLoading,
    error,
    updateUser,
    refreshUser,
    fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setDefaultVehicle,
  };
};
