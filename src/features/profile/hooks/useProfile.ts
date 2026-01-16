import { useState, useCallback } from 'react';
import { Vehicle } from '../../../types/vehicle.types';
import { vehicleService } from '../services/vehicleService';
// import { useAuth } from '../../../store/AuthContext';

export const useProfile = () => {
  // const { user, updateUser, refreshUser } = useAuth();
  const user = { name: 'Người dùng Test', email: 'test@example.com', phone: '0909090909', id: '1' };
  const updateUser = async () => { };
  const refreshUser = async () => { };
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await vehicleService.getVehicles();
      setVehicles(response.data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addVehicle = useCallback(async (vehicle: Omit<Vehicle, 'id' | 'userId'>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await vehicleService.createVehicle(vehicle);
      setVehicles(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err as Error);
      console.error('Error adding vehicle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await vehicleService.updateVehicle(id, data);
      setVehicles(prev =>
        prev.map(v => (v.id === id ? response.data : v))
      );
      return response.data;
    } catch (err) {
      setError(err as Error);
      console.error('Error updating vehicle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await vehicleService.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setError(err as Error);
      console.error('Error deleting vehicle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDefaultVehicle = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await vehicleService.setDefaultVehicle(id);
      setVehicles(prev =>
        prev.map(v => ({ ...v, isDefault: v.id === id }))
      );
    } catch (err) {
      setError(err as Error);
      console.error('Error setting default vehicle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

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