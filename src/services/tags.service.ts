import { apiClient, getErrorMessage } from '@/lib/api';
import { useWorkspaceStore, waitForWorkspace } from '@/stores/workspace.store';

// =============================================
// Tags Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// Tags são globais por workspace/organização
// =============================================

async function getWorkspaceId(): Promise<number> {
  const store = useWorkspaceStore.getState();
  if (store.currentWorkspace?.id) {
    return Number(store.currentWorkspace.id);
  }
  const workspaceId = await waitForWorkspace();
  if (!workspaceId) {
    throw new Error('No workspace selected');
  }
  return Number(workspaceId);
}

const ENDPOINTS = {
  LIST: (workspaceId: number) => `/api/workspaces/${workspaceId}/tags`,
  GET: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/tags/${id}`,
  CREATE: (workspaceId: number) => `/api/workspaces/${workspaceId}/tags`,
  UPDATE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/tags/${id}`,
  DELETE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/tags/${id}`,
  SEARCH: (workspaceId: number) => `/api/workspaces/${workspaceId}/tags/search`,
} as const;

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface TagResponse {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagData {
  name: string;
}

export interface UpdateTagData {
  name: string;
}

function mapTag(tag: TagResponse): Tag {
  return {
    id: String(tag.id),
    name: tag.name,
    slug: tag.slug,
    usageCount: tag.usageCount,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}

/**
 * Get all tags for the workspace
 * GET /api/workspaces/{workspaceId}/tags
 */
export async function getTags(params?: { search?: string; sort?: string }): Promise<Tag[]> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<TagResponse[]>>(ENDPOINTS.LIST(workspaceId), {
      params: {
        search: params?.search,
        sort: params?.sort || '-usageCount', // Default: most used first
      },
    });
    return response.data.data.map(mapTag);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

/**
 * Search tags for autocomplete
 * GET /api/workspaces/{workspaceId}/tags/search?q={query}
 */
export async function searchTags(query: string): Promise<Tag[]> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<TagResponse[]>>(ENDPOINTS.SEARCH(workspaceId), {
      params: { q: query },
    });
    return response.data.data.map(mapTag);
  } catch (error) {
    console.error('Error searching tags:', error);
    throw error;
  }
}

/**
 * Get a single tag
 * GET /api/workspaces/{workspaceId}/tags/{id}
 */
export async function getTag(id: string): Promise<Tag | null> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<TagResponse>>(ENDPOINTS.GET(workspaceId, id));
    return mapTag(response.data.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new tag
 * POST /api/workspaces/{workspaceId}/tags
 */
export async function createTag(data: CreateTagData): Promise<Tag> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<TagResponse>>(ENDPOINTS.CREATE(workspaceId), {
      name: data.name,
    });
    return mapTag(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao criar tag');
  }
}

/**
 * Update a tag
 * PUT /api/workspaces/{workspaceId}/tags/{id}
 */
export async function updateTag(id: string, data: UpdateTagData): Promise<Tag> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.put<ApiResponse<TagResponse>>(ENDPOINTS.UPDATE(workspaceId, id), {
      name: data.name,
    });
    return mapTag(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar tag');
  }
}

/**
 * Delete a tag
 * DELETE /api/workspaces/{workspaceId}/tags/{id}
 */
export async function deleteTag(id: string): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.delete(ENDPOINTS.DELETE(workspaceId, id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir tag');
  }
}

export const tagsService = {
  getTags,
  searchTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
};
