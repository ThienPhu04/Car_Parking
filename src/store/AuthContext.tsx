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

      // const { user: userData, tokens: tokensData } = response.data;
      const userData = response?.data?.data;
      // const tokensData = response?.data?.tokens;
      // if (!tokensData) {
      //    /* show lỗi, throw hoặc return */ 
      //    throw new Error('No tokens returned'); 
      //   }
      if (!userData) {
        throw new Error('No user returned');
      }
      // await Promise.all([
      //   storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, userData),
      //   storage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, tokensData.accessToken),
      //   storage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, tokensData.refreshToken),
      // ]);
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, userData);

      setUser(userData);
      setTokens(null);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // const login = async (email: string, password: string) => {
  //   try {
  //     const response = await authService.login({ email, password });
  //     console.log('LOGIN RESPONSE:', response);
  //     const response1 = await apiClient.get<ParkingSlot[]>(ENDPOINTS.GET_MAP);
  //           console.log('API car parking response:', response1);
  //     // Normalize response shape coming from apiClient / server
  //     // apiClient.post returns `response.data` (server body), while some services
  //     // might return the full axios response. Support both shapes safely.
  //     const serverBody = response?.data ?? response; // if axios response, take .data; otherwise response is already body
  //     const payload = serverBody?.data ?? serverBody; // if server nests actual payload in `data`, unwrap it

  //     const userData = payload?.user ?? payload; // payload might be { user, tokens } or directly the user object
  //     const tokensData = payload?.tokens ?? null;

  //     if (!userData) {
  //       throw new Error('No user returned');
  //     }

  //     // Persist user always; persist tokens only if present
  //     await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, userData);
  //     if (tokensData?.accessToken) {
  //       await Promise.all([
  //         storage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, tokensData.accessToken),
  //         storage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, tokensData.refreshToken),
  //       ]);
  //       setTokens(tokensData);
  //     } else {
  //       // Ensure we don't crash elsewhere; keep tokens null for now
  //       await storage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  //       await storage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  //       setTokens(null);
  //     }

  //     setUser(userData);
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     throw error;
  //   }
  // };


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
    // isAuthenticated: !!user,
    // isAuthenticated: !!user && !!tokens,
    isAuthenticated: true,
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