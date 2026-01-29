import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  OTPVerificationRequest,
} from '../../../types/auth.types';
import { ApiResponse } from '../../../types/api.types';


export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<{
    data: any; user: User; tokens: AuthTokens 
}>> {
    return apiClient.post(ENDPOINTS.LOGIN, credentials);
  },

  async register(data: RegisterRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(ENDPOINTS.REGISTER, data);
  },

  async verifyOTP(data: OTPVerificationRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return apiClient.post(ENDPOINTS.VERIFY_OTP, data);
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    return apiClient.post(ENDPOINTS.REFRESH_TOKEN, { refreshToken });
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post(ENDPOINTS.LOGOUT);
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(ENDPOINTS.FORGOT_PASSWORD, { email });
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get(ENDPOINTS.GET_PROFILE);
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put(ENDPOINTS.UPDATE_PROFILE, data);
  },
};