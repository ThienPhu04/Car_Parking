export interface User {
  id?: string;
  code?: string;
  name?: string;
  userName?: string;
  role: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  isVerified?: boolean;
  isGuest?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  code?: string;
  userName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface LoginResponseData extends User {
  accessToken?: string;
  refreshToken?: string;
}

export interface UpdateUserPayload extends Partial<User> {
  oldPassword?: string;
  password?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
