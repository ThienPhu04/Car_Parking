import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, AuthTokens, LoginResponseData } from '../types/auth.types';
import { authService } from '../features/auth/services/authService';
import { storage } from '../shared/utils/storage';
import { CONFIG } from '../shared/constants/config';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
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

      if (savedUser) {
        setUser(savedUser);
      }

      if (savedToken && savedRefreshToken) {
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

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      console.log('LOGIN RESPONSE:', response);

      const responseData = response?.data as LoginResponseData | undefined;
      const accessToken =
        response?.accessToken || responseData?.accessToken || null;
      const refreshToken =
        response?.refreshToken || responseData?.refreshToken || null;

      if (!responseData?.email) {
        console.error('Invalid user data:', responseData);
        throw new Error('No user returned from server');
      }

      const normalizedUser: User = {
        id: responseData.id,
        code: responseData.code,
        name: responseData.name || responseData.userName,
        userName: responseData.userName || responseData.name,
        role: responseData.role,
        email: responseData.email,
        phone: responseData.phone,
        avatar: responseData.avatar,
        createdAt: responseData.createdAt,
      };

      const normalizedTokens =
        accessToken && refreshToken
          ? {
              accessToken,
              refreshToken,
            }
          : null;

      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, normalizedUser);

      if (normalizedTokens) {
        await Promise.all([
          storage.setItem(
            CONFIG.STORAGE_KEYS.AUTH_TOKEN,
            normalizedTokens.accessToken
          ),
          storage.setItem(
            CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
            normalizedTokens.refreshToken
          ),
        ]);
      }

      setUser(normalizedUser);
      setTokens(normalizedTokens);
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

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await authService.updateProfile(userData);
      const updatedUser = response.data;
      setUser(updatedUser);
      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
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
