import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// =============================================
// API Configuration - Direct Backend Integration
// In production: uses relative URL (Nginx proxy)
// In development: uses localhost:8080
// =============================================

const getApiBaseUrl = () => {
  // Se NEXT_PUBLIC_API_URL está definida, use ela
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Em produção (browser), usar URL relativa para o Nginx fazer proxy
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return ''; // URL relativa - Nginx vai fazer proxy de /api para localhost:8080
  }
  
  // Em desenvolvimento local
  return 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl();

// Debug flag - set to true for detailed logging
const DEBUG_MODE = true;

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[API Debug] ${message}`, data !== undefined ? data : '');
  }
}

/**
 * Backend ApiResponse wrapper type
 * All backend responses follow this format:
 * { success: boolean, message?: string, data: T, timestamp: string }
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

/**
 * Extract data from ApiResponse wrapper
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

/**
 * Create Axios instance with proper configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: false, // Set to false for CORS without credentials
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      
      debugLog(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
      
      return config;
    },
    (error) => {
      debugLog('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors and token refresh
  client.interceptors.response.use(
    (response) => {
      debugLog(`Response: ${response.status} ${response.config.url}`, response.data);
      return response;
    },
    async (error: AxiosError<any>) => {
      const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
      debugLog('Response error:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        code: error.code,
        message: error.message,
      });

      // Network error
      if (!error.response) {
        console.error('❌ Network Error - Backend não está respondendo');
        console.error('Certifique-se que o backend Spring Boot está rodando em:', API_BASE_URL);
        return Promise.reject(new Error(`Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${API_BASE_URL}`));
      }

      // 401 Unauthorized - Try refresh token
      if (error.response?.status === 401 && !config._retry) {
        config._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            debugLog('Attempting token refresh...');
            
            const response = await axios.post<ApiResponse<any>>(`${API_BASE_URL}/api/auth/refresh`, { 
              refreshToken 
            });
            
            if (response.data.success && response.data.data) {
              const { accessToken } = response.data.data;
              localStorage.setItem('accessToken', accessToken);
              
              if (config.headers) {
                config.headers.Authorization = `Bearer ${accessToken}`;
              }
              
              debugLog('Token refreshed successfully');
              return client(config);
            }
          }
        } catch (refreshError) {
          debugLog('Token refresh failed:', refreshError);
          // Clear tokens on refresh failure
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          // Redirect to login
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// =============================================
// API Helper Functions
// =============================================

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const response = await apiClient.get<T>(endpoint, { params });
  return response.data;
}

/**
 * POST request
 */
export async function apiPost<T>(endpoint: string, data?: any): Promise<T> {
  const response = await apiClient.post<T>(endpoint, data);
  return response.data;
}

/**
 * PUT request
 */
export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
  const response = await apiClient.put<T>(endpoint, data);
  return response.data;
}

/**
 * PATCH request
 */
export async function apiPatch<T>(endpoint: string, data?: any): Promise<T> {
  const response = await apiClient.patch<T>(endpoint, data);
  return response.data;
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await apiClient.delete<T>(endpoint);
  return response.data;
}

/**
 * File upload
 */
export async function apiUpload<T>(
  endpoint: string,
  files: File | File[],
  additionalData?: Record<string, any>
): Promise<T> {
  const formData = new FormData();
  
  if (Array.isArray(files)) {
    files.forEach((file) => formData.append('files', file));
  } else {
    formData.append('file', files);
  }
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    });
  }
  
  const response = await apiClient.post<T>(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  return response.data;
}

/**
 * Extract error message from error object
 */
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    // Backend error response
    const responseData = error.response?.data;
    
    if (responseData) {
      // ApiResponse format
      if (responseData.message) {
        return responseData.message;
      }
      // Spring validation errors
      if (responseData.errors && Array.isArray(responseData.errors)) {
        return responseData.errors.join(', ');
      }
      // Generic error field
      if (responseData.error) {
        return responseData.error;
      }
    }
    
    // HTTP status based messages
    switch (error.response?.status) {
      case 400:
        return 'Dados inválidos. Verifique as informações e tente novamente.';
      case 401:
        return 'Credenciais inválidas. Verifique email e senha.';
      case 403:
        return 'Acesso negado. Você não tem permissão para esta ação.';
      case 404:
        return 'Recurso não encontrado.';
      case 409:
        return 'Conflito. O recurso já existe.';
      case 422:
        return 'Não foi possível processar a requisição.';
      case 500:
        return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    
    return error.message || 'Ocorreu um erro na requisição';
  }
  
  return error?.message || 'Ocorreu um erro inesperado';
}

export default apiClient;
