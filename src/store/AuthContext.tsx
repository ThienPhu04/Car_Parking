import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, AuthTokens, UpdateUserPayload } from '../types/auth.types';
import { authService } from '../features/auth/services/authService';
import { storage } from '../shared/utils/storage';
import { CONFIG } from '../shared/constants/config';
import { apiClient } from '../services/api/apiClient';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (
    userData: UpdateUserPayload
  ) => Promise<{ user: User; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeLoginPayload = (payload: any) => {
  const responseData = payload?.data?.data ?? payload?.data ?? payload?.user ?? payload;
  const accessToken =
    payload?.accessToken
    ?? payload?.data?.accessToken
    ?? responseData?.accessToken
    ?? null;
  const refreshToken =
    payload?.refreshToken
    ?? payload?.data?.refreshToken
    ?? responseData?.refreshToken
    ?? null;

  if (!responseData?.email) {
    throw new Error('Khong nhan duoc thong tin nguoi dung tu server');
  }

  const normalizedUser: User = {
    id: responseData.id ?? responseData._id,
    code: responseData.code,
    name: responseData.name || responseData.userName,
    userName: responseData.userName || responseData.name,
    role: responseData.role ?? 'user',
    email: responseData.email,
    phone: responseData.phone,
    avatar: responseData.avatar,
    createdAt: responseData.createdAt,
    isGuest: false,
  };

  return {
    user: normalizedUser,
    tokens: accessToken
      ? {
          accessToken,
          ...(refreshToken ? { refreshToken } : {}),
        }
      : null,
  };
};

const normalizeUserPayload = (payload: any, fallbackUser?: User | null): User => {
  const responseData = payload?.data?.data ?? payload?.data ?? payload?.user ?? payload;

  if (!responseData && !fallbackUser) {
    throw new Error('Khong nhan duoc thong tin nguoi dung tu server');
  }

  return {
    id: responseData?.id ?? responseData?._id ?? fallbackUser?.id,
    code: responseData?.code ?? fallbackUser?.code,
    name: responseData?.name || responseData?.userName || fallbackUser?.name,
    userName:
      responseData?.userName || responseData?.name || fallbackUser?.userName,
    role: responseData?.role ?? fallbackUser?.role ?? 'user',
    email: responseData?.email ?? fallbackUser?.email ?? '',
    phone: responseData?.phone ?? fallbackUser?.phone,
    avatar: responseData?.avatar ?? fallbackUser?.avatar,
    createdAt: responseData?.createdAt ?? fallbackUser?.createdAt,
    isVerified: responseData?.isVerified ?? fallbackUser?.isVerified,
    isGuest: false,
  };
};

const buildGuestUser = (): User => ({
  id: 'guest-local-user',
  code: 'GUEST',
  name: 'Khach',
  userName: 'Khach',
  role: 'guest',
  email: 'guest@local.smartparking',
  isGuest: true,
  createdAt: new Date().toISOString(),
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const persistUser = async (nextUser: User) => {
    setUser(nextUser);
    await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, nextUser);
  };

  const loadAuthData = async () => {
    try {
      const [savedUser, savedToken, savedRefreshToken] = await Promise.all([
        storage.getItem<User>(CONFIG.STORAGE_KEYS.USER_DATA),
        storage.getItem<string>(CONFIG.STORAGE_KEYS.AUTH_TOKEN),
        storage.getItem<string>(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      if (savedUser && (savedUser.isGuest || savedToken)) {
        apiClient.setAccessToken(savedUser.isGuest ? null : savedToken);
        setUser(savedUser);
        setTokens({
          accessToken: savedUser.isGuest ? 'guest-local-session' : savedToken!,
          ...(savedUser.isGuest
            ? {}
            : (savedRefreshToken ? { refreshToken: savedRefreshToken } : {})),
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
      const normalized = normalizeLoginPayload(response);
      apiClient.setAccessToken(normalized.tokens?.accessToken ?? null);

      setUser(normalized.user);
      setTokens(normalized.tokens);

      await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, normalized.user);

      if (normalized.tokens?.accessToken) {
        await storage.setItem(
          CONFIG.STORAGE_KEYS.AUTH_TOKEN,
          normalized.tokens.accessToken,
        );
      }

      if (normalized.tokens?.refreshToken) {
        await storage.setItem(
          CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
          normalized.tokens.refreshToken,
        );
      } else {
        await storage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      }
    } catch (error) {
      apiClient.setAccessToken(null);
      console.error('Login error:', error);
      throw error;
    }
  };

  const guestLogin = async () => {
    const guestUser = buildGuestUser();
    const guestTokens: AuthTokens = {
      accessToken: 'guest-local-session',
    };

    apiClient.setAccessToken(null);
    setUser(guestUser);
    setTokens(guestTokens);

    await storage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, guestUser);
    await storage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  };

  const logout = async () => {
    try {
      if (!user?.isGuest) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.setAccessToken(null);
      await Promise.all([
        storage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA),
        storage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN),
        storage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN),
      ]);
      setUser(null);
      setTokens(null);
    }
  };

  const updateUser = async (userData: UpdateUserPayload) => {
    if (user?.isGuest) {
      const updatedGuestUser = { ...user, ...userData };
      await persistUser(updatedGuestUser);
      return {
        user: updatedGuestUser,
      };
    }

    if (!user?.code) {
      throw new Error('Khong tim thay ma nguoi dung');
    }

    try {
      const response = await authService.updateInfoAccount(user.code, userData);
      const profileResponse = await authService.getInfoAccount(user.code);
      const updatedUser = normalizeUserPayload(profileResponse.data, user);

      await persistUser(updatedUser);
      return {
        user: updatedUser,
        message: response.message,
      };
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (user?.isGuest) {
      return;
    }

    try {
      if (!user?.code) {
        throw new Error('Khong tim thay ma nguoi dung');
      }

      const response = await authService.getInfoAccount(user.code);
      const userData = normalizeUserPayload(response.data, user);
      await persistUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user && (user.isGuest || !!tokens?.accessToken),
    isLoading,
    login,
    guestLogin,
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
