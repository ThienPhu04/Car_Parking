import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthTokens } from '../types/auth.types';
import { authService } from '../features/auth/services/authService';
import { storage } from '../shared/utils/storage';
import { CONFIG } from '../shared/constants/config';
import { ENDPOINTS } from '@shared/constants/endpoints';
import { ParkingSlot } from '@app-types/parking.types';
import { apiClient } from '@services/api/apiClient';


interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const [savedUser, savedToken, savedRefreshToken] = await Promise.all([
        storage.getItem<User>(CONFIG.STORAGE_KEYS.USER_DATA),
        storage.getItem<string>(CONFIG.STORAGE_KEYS.AUTH_TOKEN),
        storage.getItem<string>(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      // if (savedUser && savedToken && savedRefreshToken) {
      //   setUser(savedUser);
      //   setTokens({
      //     accessToken: savedToken,
      //     refreshToken: savedRefreshToken,
      //   });
      // }
      if (savedUser) {
        setUser(savedUser);
      }

    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      console.log('LOGIN RESPONSE:', response);

      const responseData = response?.data;
      
      // Lấy user từ response - xử lý cả 2 format
      const user = responseData?.user || responseData;
      
      if (!user || !user.email) {
        console.error('Invalid user data:', responseData);
        throw new Error('No user returned from server');
      }

      // Lưu user data
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, user);

      // Nếu có tokens, lưu lại
      if (responseData?.tokens?.accessToken) {
        await Promise.all([
          storage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, responseData.tokens.accessToken),
          storage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, responseData.tokens.refreshToken),
        ]);
        setTokens(responseData.tokens);
      }

      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await Promise.all([
        storage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA),
        storage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN),
        storage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
      ]);
      setUser(null);
      setTokens(null);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, userData);
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      const userData = response.data;
      updateUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user,
    // isAuthenticated: !!user && !!tokens,
    // isAuthenticated: true,
    isLoading,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};