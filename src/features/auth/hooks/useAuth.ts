import { useAuth as useAuthContext } from '../../../store/AuthContext';
import { useState } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const authContext = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const loginWithPhone = async (phone: string, password: string) => {
    try {
      setIsLoading(true);
      await authContext.login(phone, password);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithPhone = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);
      await authService.register(data);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (phone: string, otp: string) => {
    try {
      setIsLoading(true);
      await authService.verifyOTP({ phone, otp });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...authContext,
    isLoading,
    loginWithPhone,
    registerWithPhone,
    verifyOTP,
  };
};