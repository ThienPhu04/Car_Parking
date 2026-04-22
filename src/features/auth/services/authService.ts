import { apiClient } from '../../../services/api/apiClient';
import { ENDPOINTS } from '../../../shared/constants/endpoints';
import {
  User,
  AuthTokens,
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  UpdateUserPayload,
} from '../../../types/auth.types';
import { ApiResponse, AuthApiResponse } from '../../../types/api.types';


export const authService = {
  async login(credentials: LoginRequest): Promise<AuthApiResponse<LoginResponseData>> {
    return apiClient.post(ENDPOINTS.LOGIN, credentials);
  },

  async register(
    data: RegisterRequest
  ): Promise<ApiResponse<{ id: string; email: string }>> {
    return apiClient.post(ENDPOINTS.REGISTER, data);
  },

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return apiClient.get(
      `${ENDPOINTS.VERIFY_EMAIL}?token=${encodeURIComponent(token)}`
    );
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

  async getInfoAccount(code: string): Promise<ApiResponse<User>> {
    return apiClient.post(ENDPOINTS.GET_INFO_ACCOUNT, { code });
  },

  async updateInfoAccount(
    code: string,
    data: UpdateUserPayload
  ): Promise<ApiResponse<User | null>> {
    return apiClient.post(ENDPOINTS.UPDATE_INFO_ACCOUNT, {
      code,
      ...data,
    });
  },
};
