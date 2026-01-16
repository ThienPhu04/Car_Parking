import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthTokens } from '../types/auth.types';
import { authService } from '../features/auth/services/authService';
import { storage } from '../shared/utils/storage';
import { CONFIG } from '../shared/constants/config';

// 🔧 DEVELOPMENT MODE - Set to true để bypass auth
const DEV_MODE = true; // 👈 THAY ĐỔI Ở ĐÂY
const MOCK_USER: User = {
  id: 'dev_user_001',
  name: 'Developer User',
  email: 'dev@smartparking.com',
  phone: '0123456789',
  avatar: undefined,
  createdAt: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Trong AuthProvider
  // const [user, setUser] = useState<User | null>({
  //   id: 'guest_001',
  //   name: 'Người dùng',
  //   phone: '0123456789',
  //   email: 'guest@example.com',
  //   avatar: "null",
  //   createdAt: new Date().toISOString(),
  // });

  // const [tokens, setTokens] = useState<AuthTokens | null>({
  //   accessToken: 'guest_token',
  //   refreshToken: 'guest_refresh_token',
  // });

  // const [isLoading, setIsLoading] = useState(false); // Đặt false ngay từ đầu
  useEffect(() => {
    loadAuthData();
  }, []);
  console.log('AuthContext - user:', user);
  console.log('AuthContext - tokens:', tokens);
  const loadAuthData = async () => {
    try {
      const [savedUser, savedToken, savedRefreshToken] = await Promise.all([
        storage.getItem<User>(CONFIG.STORAGE_KEYS.USER_DATA),
        storage.getItem<string>(CONFIG.STORAGE_KEYS.AUTH_TOKEN),
        storage.getItem<string>(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      if (savedUser && savedToken && savedRefreshToken) {
        setUser(savedUser);
        setTokens({
          accessToken: savedToken,
          refreshToken: savedRefreshToken,
        });
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await authService.login({ phone, password });
      const { user: userData, tokens: tokensData } = response.data;

      await Promise.all([
        storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, userData),
        storage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, tokensData.accessToken),
        storage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, tokensData.refreshToken),
      ]);

      setUser(userData);
      setTokens(tokensData);
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
    isAuthenticated: !!user && !!tokens,
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