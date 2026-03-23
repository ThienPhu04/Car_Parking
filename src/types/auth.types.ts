export interface User {
  id?: string;
  code?: string; // Mã người dùng backend cần
  name?: string;
  role: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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

export interface OTPVerificationRequest {
  phone: string;
  otp: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}