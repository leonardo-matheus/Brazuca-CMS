import { apiClient, getErrorMessage } from '@/lib/api';
import { ApiKeyStats, ApiUsage } from '@/types';
import { useWorkspaceStore, waitForWorkspace } from '@/stores/workspace.store';

// =============================================
// API Keys Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// =============================================

/**
 * Helper to get current workspace ID (waits for workspace to be ready)
 */
async function getWorkspaceId(): Promise<number> {
  const store = useWorkspaceStore.getState();
  
  // If workspace is already available, return it
  if (store.currentWorkspace?.id) {
    return Number(store.currentWorkspace.id);
  }
  
  // Wait for workspace to be initialized
  const workspaceId = await waitForWorkspace();
  if (!workspaceId) {
    throw new Error('No workspace selected');
  }
  return Number(workspaceId);
}

/**
 * API Endpoints - Spring Boot Backend
 */
const ENDPOINTS = {
  LIST: (workspaceId: number) => `/api/workspaces/${workspaceId}/api-keys`,
  GET: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/api-keys/${id}`,
  CREATE: (workspaceId: number) => `/api/workspaces/${workspaceId}/api-keys`,
  REVOKE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/api-keys/${id}/revoke`,
  REGENERATE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/api-keys/${id}/regenerate`,
  USAGE: (workspaceId: number) => `/api/workspaces/${workspaceId}/api-keys/usage`,
} as const;

// Spring Boot response types
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Spring Boot response types
interface ApiKeyResponse {
  id: number;
  name: string;
  keyPrefix: string;
  type: string;
  permissions: string[];
  requestsThisMonth: number;
  requestsToday: number;
  lastUsedAt?: string;
  createdAt: string;
  status: string;
}

interface ApiUsageResponse {
  totalRequests: number;
  rateLimit: number;
  rateLimitRemaining: number;
  requestsThisMonth: number;
  monthlyLimit: number;
}

// Transform Spring Boot response to frontend format
function mapApiKey(key: ApiKeyResponse): ApiKeyStats {
  return {
    id: String(key.id),
    name: key.name,
    keyPrefix: key.keyPrefix,
    type: key.type as 'public' | 'secret',
    permissions: key.permissions,
    requestsThisMonth: key.requestsThisMonth,
    requestsToday: key.requestsToday,
    lastUsedAt: key.lastUsedAt,
    createdAt: key.createdAt,
    status: key.status as 'active' | 'revoked',
  };
}

/**
 * Get all API keys
 * GET /api/workspaces/{workspaceId}/api-keys
 */
export async function getApiKeys(): Promise<ApiKeyStats[]> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<ApiKeyResponse[]>>(ENDPOINTS.LIST(workspaceId));
    return response.data.data.map(mapApiKey);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }
}

/**
 * Get API usage stats
 * GET /api/workspaces/{workspaceId}/api-keys/usage
 */
export async function getApiUsage(): Promise<ApiUsage> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<ApiUsageResponse>>(ENDPOINTS.USAGE(workspaceId));
    return response.data.data;
  } catch (error) {
    console.error('Error fetching API usage:', error);
    // Return default values on error
    return {
      totalRequests: 0,
      rateLimit: 1000,
      rateLimitRemaining: 1000,
      requestsThisMonth: 0,
      monthlyLimit: 100000,
    };
  }
}

/**
 * Generate a new API key
 * POST /api/workspaces/{workspaceId}/api-keys
 */
export async function generateApiKey(data: {
  name: string;
  type: 'public' | 'secret';
  permissions: string[];
}): Promise<{ apiKey: ApiKeyStats; fullKey: string }> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<{ apiKey: ApiKeyResponse; fullKey: string }>>(ENDPOINTS.CREATE(workspaceId), {
      name: data.name,
      type: data.type,
      permissions: data.permissions,
    });
    
    return {
      apiKey: mapApiKey(response.data.data.apiKey),
      fullKey: response.data.data.fullKey,
    };
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao gerar chave de API');
  }
}

/**
 * Revoke an API key
 * POST /api/workspaces/{workspaceId}/api-keys/{id}/revoke
 */
export async function revokeApiKey(id: string): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.post(ENDPOINTS.REVOKE(workspaceId, id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao revogar chave de API');
  }
}

export const apiKeysService = {
  getApiKeys,
  getApiUsage,
  generateApiKey,
  revokeApiKey,
};
