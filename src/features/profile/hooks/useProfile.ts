import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Vehicle } from '../../../types/vehicle.types';
import { vehicleService } from '../services/vehicleService';
import { useAuth } from '../../../store/AuthContext';

export const useProfile = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      if (!user?.code) {
        console.error('🚨 [useProfile] Không lấy được `user.code` từ Auth Context! Backend bắt buộc sửa API Login để trả về `code`!');
        Alert.alert(
          'Lỗi dữ liệu User',
          'Tài khoản đang đăng nhập không có "Mã người dùng" (code). Vui lòng báo dev Backend thêm trường "code" vào API Login!'
        );
      }

      setIsLoading(true);
      setError(null);

      // Nếu user.code bị undefined, ta tạm mượn chuỗi 'US000' để xem server phản hồi sao (ít nhất là ko lỗi 500)
      const payloadUserId = user?.code || '';

      console.log('📤 [useProfile] API getVehicles Payload:', { userId: payloadUserId });

      const response = await vehicleService.getVehicles({ userId: payloadUserId });
      setVehicles(response.data);
    } catch (err) {
      setError(err as Error);
      console.error('❌ [useProfile] Lỗi fetch vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addVehicle = useCallback(async (vehicle: Omit<Vehicle, 'id' | 'userId'>) => {
    try {
      if (!user?.code) {
        Alert.alert('Lỗi', 'Không có userId tĩnh để gửi! Vui lòng cập nhật API Login trả về code.');
        throw new Error('Thiếu userId');
      }

      setIsLoading(true);
      setError(null);
      
      const payload: any = {
        userId: user.code, 
        nameVehicles: (vehicle.brand || vehicle.model) ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : 'Bãi xe mặc định',
        licensePlate: vehicle.licensePlate,
        status: 1
      };

      console.log('📤 [useProfile] API createVehicle Payload:', payload);

      const response = await vehicleService.createVehicle(payload);
      setVehicles(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err as Error);
      console.error('❌ [useProfile] Lỗi thêm xe:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle>) => {
    try {
      setIsLoading(true);
      setError(null);

      // Map frontend data to backend expected format
      const payload: any = {
        licensePlate: data.licensePlate,
      };
      
      if (data.brand) {
        payload.nameVehicles = `${data.brand} ${data.model || ''}`.trim();
      }

      console.log(`📤 [useProfile] API updateVehicle Payload cho xe ${id}:`, payload);

      const response = await vehicleService.updateVehicle(id, payload);
      setVehicles(prev =>
        prev.map(v => (v.id === id ? response.data : v))
      );
      return response.data;
    } catch (err) {
      setError(err as Error);
      console.error('❌ [useProfile] Lỗi cập nhật xe:', err);
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