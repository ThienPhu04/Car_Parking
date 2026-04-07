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
      await authService.register({
        userName: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.password,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setIsLoading(true);
      await authService.verifyEmail(token);
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
    verifyEmail,
  };
};
