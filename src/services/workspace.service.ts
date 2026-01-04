import { apiClient, getErrorMessage } from '@/lib/api';

// =============================================
// Workspace Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// =============================================

/**
 * API Endpoints - Spring Boot Backend
 */
const ENDPOINTS = {
  LIST: '/api/workspaces',
  GET: (id: string) => `/api/workspaces/${id}`,
  CREATE: '/api/workspaces',
  UPDATE: (id: string) => `/api/workspaces/${id}`,
  DELETE: (id: string) => `/api/workspaces/${id}`,
  MEMBERS: (id: string) => `/api/workspaces/${id}/members`,
  ADD_MEMBER: (id: string) => `/api/workspaces/${id}/members`,
  REMOVE_MEMBER: (id: string, memberId: string) => `/api/workspaces/${id}/members/${memberId}`,
} as const;

// Local storage key for current workspace
const WORKSPACE_KEY = 'currentWorkspaceId';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

function mapWorkspace(ws: WorkspaceResponse): Workspace {
  return {
    id: String(ws.id),
    name: ws.name,
    slug: ws.slug,
    description: ws.description,
    createdAt: ws.createdAt,
    updatedAt: ws.updatedAt,
  };
}

/**
 * Get the current workspace ID from localStorage
 */
export function getCurrentWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(WORKSPACE_KEY);
}

/**
 * Set the current workspace ID in localStorage
 */
export function setCurrentWorkspaceId(workspaceId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WORKSPACE_KEY, workspaceId);
}

/**
 * Clear the current workspace ID from localStorage
 */
export function clearCurrentWorkspaceId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WORKSPACE_KEY);
}

/**
 * Get all workspaces for the current user
 * GET /api/workspaces
 */
export async function getWorkspaces(page = 0, limit = 10): Promise<{ workspaces: Workspace[]; total: number }> {
  try {
    const response = await apiClient.get<ApiResponse<PageResponse<WorkspaceResponse>>>(ENDPOINTS.LIST, {
      params: { page, limit },
    });
    
    const data = response.data.data;
    const workspaces = data.content.map(mapWorkspace);
    
    // Auto-select first workspace if none selected
    if (workspaces.length > 0 && !getCurrentWorkspaceId()) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
    
    return {
      workspaces,
      total: data.totalElements,
    };
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
    throw new Error(getErrorMessage(error) || 'Erro ao buscar workspaces');
  }
}

/**
 * Get a single workspace by ID
 * GET /api/workspaces/{id}
 */
export async function getWorkspace(id: string): Promise<Workspace | null> {
  try {
    const response = await apiClient.get<ApiResponse<WorkspaceResponse>>(ENDPOINTS.GET(id));
    return mapWorkspace(response.data.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(getErrorMessage(error) || 'Erro ao buscar workspace');
  }
}

/**
 * Create a new workspace
 * POST /api/workspaces
 */
export async function createWorkspace(data: { name: string; slug?: string; description?: string }): Promise<Workspace> {
  try {
    const response = await apiClient.post<ApiResponse<WorkspaceResponse>>(ENDPOINTS.CREATE, data);
    const workspace = mapWorkspace(response.data.data);
    
    // Set as current workspace
    setCurrentWorkspaceId(workspace.id);
    
    return workspace;
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Erro ao criar workspace');
  }
}

/**
 * Update a workspace
 * PUT /api/workspaces/{id}
 */
export async function updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
  try {
    const response = await apiClient.put<ApiResponse<WorkspaceResponse>>(ENDPOINTS.UPDATE(id), data);
    return mapWorkspace(response.data.data);
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Erro ao atualizar workspace');
  }
}

/**
 * Delete a workspace
 * DELETE /api/workspaces/{id}
 */
export async function deleteWorkspace(id: string): Promise<void> {
  try {
    await apiClient.delete(ENDPOINTS.DELETE(id));
    
    // Clear current workspace if deleted
    if (getCurrentWorkspaceId() === id) {
      clearCurrentWorkspaceId();
    }
  } catch (error: any) {
    throw new Error(getErrorMessage(error) || 'Erro ao deletar workspace');
  }
}

/**
 * Ensure a workspace is selected, creating a default one if needed
 */
export async function ensureWorkspace(): Promise<string> {
  let workspaceId = getCurrentWorkspaceId();
  
  if (workspaceId) {
    return workspaceId;
  }
  
  try {
    // Try to get existing workspaces
    const { workspaces } = await getWorkspaces();
    
    if (workspaces.length > 0) {
      setCurrentWorkspaceId(workspaces[0].id);
      return workspaces[0].id;
    }
    
    // Create default workspace
    const workspace = await createWorkspace({
      name: 'Default Workspace',
      slug: 'default',
      description: 'Workspace padrão do sistema',
    });
    
    return workspace.id;
  } catch (error) {
    console.error('Error ensuring workspace:', error);
    throw error;
  }
}
