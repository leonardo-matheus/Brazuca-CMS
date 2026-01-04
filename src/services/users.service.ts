import { apiClient, getErrorMessage, ApiResponse } from '@/lib/api';

// =============================================
// Users Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// =============================================

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'ADMIN' | 'USER';
  active: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'COMPANY_OWNER' | 'ADMIN' | 'USER';
  companyId?: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: 'COMPANY_OWNER' | 'ADMIN' | 'USER';
  active?: boolean;
}

export interface UserListParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  companyId?: number;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// Transform backend response to frontend format
export function mapUser(user: UserResponse) {
  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
    avatar: user.avatarUrl,
    role: user.role.toLowerCase().replace('_', '-') as any,
    active: user.active,
    emailVerified: user.emailVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    companyId: user.company ? String(user.company.id) : undefined,
    companyName: user.company?.name,
  };
}

/**
 * Get all users (SUPER_ADMIN only)
 * GET /api/users
 */
export async function getAllUsers(params?: UserListParams) {
  try {
    const response = await apiClient.get<ApiResponse<PageResponse<UserResponse>>>('/api/users', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
        search: params?.search,
        role: params?.role,
        companyId: params?.companyId,
      },
    });
    
    return {
      users: response.data.data.content.map(mapUser),
      total: response.data.data.totalElements,
      totalPages: response.data.data.totalPages,
      page: response.data.data.number,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Get users from current company (COMPANY_OWNER only)
 * GET /api/companies/{companyId}/users
 */
export async function getCompanyUsers(companyId: number, params?: UserListParams) {
  try {
    const response = await apiClient.get<ApiResponse<PageResponse<UserResponse>>>(
      `/api/companies/${companyId}/users`,
      {
        params: {
          page: params?.page || 0,
          size: params?.size || 20,
          search: params?.search,
          role: params?.role,
        },
      }
    );
    
    return {
      users: response.data.data.content.map(mapUser),
      total: response.data.data.totalElements,
      totalPages: response.data.data.totalPages,
      page: response.data.data.number,
    };
  } catch (error) {
    console.error('Error fetching company users:', error);
    throw error;
  }
}

/**
 * Get user by ID
 * GET /api/users/{id}
 */
export async function getUserById(id: string) {
  try {
    const response = await apiClient.get<ApiResponse<UserResponse>>(`/api/users/${id}`);
    return mapUser(response.data.data);
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Create new user (SUPER_ADMIN can create for any company, COMPANY_OWNER for their company)
 * POST /api/users
 */
export async function createUser(data: CreateUserRequest) {
  try {
    const response = await apiClient.post<ApiResponse<UserResponse>>('/api/users', data);
    return mapUser(response.data.data);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update user
 * PUT /api/users/{id}
 */
export async function updateUser(id: string, data: UpdateUserRequest) {
  try {
    const response = await apiClient.put<ApiResponse<UserResponse>>(`/api/users/${id}`, data);
    return mapUser(response.data.data);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Delete user
 * DELETE /api/users/{id}
 */
export async function deleteUser(id: string) {
  try {
    await apiClient.delete(`/api/users/${id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Change user role
 * PUT /api/users/{id}/role
 */
export async function changeUserRole(id: string, role: 'COMPANY_OWNER' | 'ADMIN' | 'USER') {
  try {
    const response = await apiClient.put<ApiResponse<UserResponse>>(`/api/users/${id}/role`, { role });
    return mapUser(response.data.data);
  } catch (error) {
    console.error('Error changing user role:', error);
    throw error;
  }
}

/**
 * Activate/Deactivate user
 * PUT /api/users/{id}/status
 */
export async function toggleUserStatus(id: string, active: boolean) {
  try {
    const response = await apiClient.put<ApiResponse<UserResponse>>(`/api/users/${id}/status`, { active });
    return mapUser(response.data.data);
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
}
