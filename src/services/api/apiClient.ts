import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '../../shared/constants/config';
import { storage } from '../../shared/utils/storage';
import { ApiError, ApiResponse, AuthApiResponse } from '../../types/api.types';
import { ENDPOINTS } from '../../shared/constants/endpoints';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.API_BASE_URL,
      timeout: CONFIG.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (__DEV__) {
      console.log('[apiClient] Base URL:', CONFIG.API_BASE_URL);
    }

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = this.accessToken ?? await storage.getItem<string>(
          CONFIG.STORAGE_KEYS.AUTH_TOKEN
        );

        if (!this.accessToken && token) {
          this.accessToken = token;
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        const authEndpoints = [
          ENDPOINTS.LOGIN,
          ENDPOINTS.REGISTER,
          ENDPOINTS.REFRESH_TOKEN,
          ENDPOINTS.VERIFY_EMAIL,
          ENDPOINTS.FORGOT_PASSWORD,
        ];
        const requestUrl = originalRequest.url || '';
        const isAuthEndpoint = authEndpoints.some((endpoint) =>
          requestUrl.startsWith(endpoint)
        );

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await storage.getItem<string>(
              CONFIG.STORAGE_KEYS.REFRESH_TOKEN
            );

            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await this.client.post<AuthApiResponse<{ accessToken?: string }>>(
              ENDPOINTS.REFRESH_TOKEN,
              {
              refreshToken,
              }
            );

            const accessToken =
              response?.data?.accessToken || response?.data?.data?.accessToken;
            if (!accessToken) {
               throw new Error('No access token in refresh response'); 
              }
            this.accessToken = accessToken;
            await storage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, accessToken);

            this.failedQueue.forEach((prom) => prom.resolve(accessToken));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];

            // Clear auth data and redirect to login
            await storage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            await storage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
            await storage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
            this.accessToken = null;

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error
      const data: any = error.response.data;
      return {
        success: false,
        error: data.error || 'SERVER_ERROR',
        message: data.message || 'Đã xảy ra lỗi từ máy chủ',
        statusCode: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Không thể kết nối đến máy chủ',
        statusCode: 0,
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: error.message || 'Đã xảy ra lỗi không xác định',
        statusCode: 0,
      };
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }
}

export const apiClient = new ApiClient();
