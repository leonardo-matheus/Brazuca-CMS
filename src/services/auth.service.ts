import { apiClient, getErrorMessage, ApiResponse } from '@/lib/api';
import {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from '@/types';

// =============================================
// Auth Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// =============================================

/**
 * API Endpoints - Spring Boot Backend
 */
const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  ME: '/api/auth/me',
  UPDATE_PROFILE: '/api/auth/profile',
  CHANGE_PASSWORD: '/api/auth/change-password',
} as const;

/**
 * Backend AuthResponse structure
 * From: com.brazucacms.dto.auth.AuthResponse
 */
interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponseData;
}

/**
 * Backend UserResponse structure
 * From: com.brazucacms.dto.user.UserResponse
 */
interface UserResponseData {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

/**
 * Map backend role to frontend role
 * Backend roles: SUPER_ADMIN, COMPANY_OWNER, ADMIN, USER
 */
function mapRole(backendRole: string): User['role'] {
  const roleMap: Record<string, User['role']> = {
    'SUPER_ADMIN': 'super_admin',
    'COMPANY_OWNER': 'company_owner',
    'ADMIN': 'admin',
    'USER': 'user',
  };
  return roleMap[backendRole] || 'user';
}

/**
 * Login user with email and password
 * POST /api/auth/login
 * 
 * Backend Response: ApiResponse<AuthResponse>
 */
export async function login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
  try {
    console.log('[Auth] Attempting login for:', credentials.email);
    
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(AUTH_ENDPOINTS.LOGIN, {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe || false,
    });

    console.log('[Auth] Login response:', response.data);

    // Backend wraps response in ApiResponse { success, message, data, timestamp }
    const apiResponse = response.data;
    
    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.message || 'Login falhou');
    }

    const authData = apiResponse.data;

    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      console.log('[Auth] Tokens stored in localStorage');
      
      // Set cookie for SSR middleware - using secure options
      const cookieValue = `brazuca_auth_token=${authData.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = cookieValue;
      console.log('[Auth] Cookie set:', document.cookie.includes('brazuca_auth_token'));
    }

    const user: User = {
      id: String(authData.user.id),
      email: authData.user.email,
      name: authData.user.name,
      avatar: authData.user.avatarUrl,
      role: mapRole(authData.user.role),
      createdAt: authData.user.createdAt,
      updatedAt: authData.user.createdAt,
    };

    const tokens: AuthTokens = {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      expiresAt: Date.now() + (authData.expiresIn || 86400000),
    };

    console.log('[Auth] Login successful for user:', user.name, 'role:', user.role);
    return { user, tokens };
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    const message = getErrorMessage(error);
    throw new Error(message || 'Email ou senha inválidos');
  }
}

/**
 * Register new user
 * POST /api/auth/register
 * 
 * Backend Response: ApiResponse<AuthResponse>
 */
export async function register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
  try {
    console.log('[Auth] Attempting registration for:', data.email);
    
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(AUTH_ENDPOINTS.REGISTER, {
      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email,
      password: data.password,
    });

    console.log('[Auth] Register response:', response.data);

    const apiResponse = response.data;
    
    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.message || 'Registro falhou');
    }

    const authData = apiResponse.data;

    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
    }

    // Set cookie for SSR middleware
    document.cookie = `brazuca_auth_token=${authData.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

    const user: User = {
      id: String(authData.user.id),
      email: authData.user.email,
      name: authData.user.name,
      avatar: authData.user.avatarUrl,
      role: mapRole(authData.user.role),
      createdAt: authData.user.createdAt,
      updatedAt: authData.user.createdAt,
    };

    const tokens: AuthTokens = {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      expiresAt: Date.now() + (authData.expiresIn || 86400000),
    };

    console.log('[Auth] Registration successful for user:', user.name);
    return { user, tokens };
  } catch (error: any) {
    console.error('[Auth] Register error:', error);
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao criar conta');
  }
}

/**
 * Logout current user
 * POST /api/auth/logout
 */
export async function logout(): Promise<void> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (token) {
      // Call backend logout endpoint
      await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
    }
  } catch (error) {
    // Continue with logout even if API call fails
    console.error('Logout API error:', error);
  } finally {
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    
    // Clear cookie
    document.cookie = 'brazuca_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 * 
 * Backend Response: ApiResponse<UserResponse>
 */
export async function getCurrentUser(): Promise<User> {
  try {
    console.log('[Auth] Getting current user');
    
    const response = await apiClient.get<ApiResponse<UserResponseData>>(AUTH_ENDPOINTS.ME);
    
    console.log('[Auth] Current user response:', response.data);

    const apiResponse = response.data;
    
    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.message || 'Não autenticado');
    }

    const userData = apiResponse.data;

    return {
      id: String(userData.id),
      email: userData.email,
      name: userData.name,
      avatar: userData.avatarUrl,
      role: mapRole(userData.role),
      createdAt: userData.createdAt,
      updatedAt: userData.createdAt,
    };
  } catch (error: any) {
    console.error('[Auth] Get current user error:', error);
    throw new Error('Não autenticado');
  }
}

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export async function updateProfile(data: Partial<User>): Promise<User> {
  try {
    const response = await apiClient.put<ApiResponse<UserResponseData>>(AUTH_ENDPOINTS.UPDATE_PROFILE, {
      name: data.name,
      email: data.email,
    });

    const apiResponse = response.data;
    
    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.message || 'Erro ao atualizar perfil');
    }

    const userData = apiResponse.data;

    return {
      id: String(userData.id),
      email: userData.email,
      name: userData.name,
      avatar: userData.avatarUrl,
      role: mapRole(userData.role),
      createdAt: userData.createdAt,
      updatedAt: userData.createdAt,
    };
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar perfil');
  }
}

/**
 * Change user password
 * PUT /api/auth/change-password
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    await apiClient.put(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao alterar senha');
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refreshToken(): Promise<AuthTokens> {
  const currentRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await apiClient.post<ApiResponse<AuthResponseData>>(AUTH_ENDPOINTS.REFRESH, {
    refreshToken: currentRefreshToken,
  });

  const apiResponse = response.data;
  
  if (!apiResponse.success || !apiResponse.data) {
    throw new Error(apiResponse.message || 'Falha ao renovar token');
  }

  const authData = apiResponse.data;

  // Update tokens in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
  }

  // Update cookie
  document.cookie = `brazuca_auth_token=${authData.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

  return {
    accessToken: authData.accessToken,
    refreshToken: authData.refreshToken,
    expiresAt: Date.now() + (authData.expiresIn || 86400000),
  };
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('accessToken');
  return !!token;
}
