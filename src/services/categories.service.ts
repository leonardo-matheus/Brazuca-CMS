import { apiClient, getErrorMessage } from '@/lib/api';
import { useWorkspaceStore, waitForWorkspace } from '@/stores/workspace.store';

// =============================================
// Categories Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// Categorias são vinculadas a content-types específicos
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
  LIST: (workspaceId: number, contentTypeId: string) => 
    `/api/workspaces/${workspaceId}/content-types/${contentTypeId}/categories`,
  GET: (workspaceId: number, contentTypeId: string, id: string) => 
    `/api/workspaces/${workspaceId}/content-types/${contentTypeId}/categories/${id}`,
  CREATE: (workspaceId: number, contentTypeId: string) => 
    `/api/workspaces/${workspaceId}/content-types/${contentTypeId}/categories`,
  UPDATE: (workspaceId: number, contentTypeId: string, id: string) => 
    `/api/workspaces/${workspaceId}/content-types/${contentTypeId}/categories/${id}`,
  DELETE: (workspaceId: number, contentTypeId: string, id: string) => 
    `/api/workspaces/${workspaceId}/content-types/${contentTypeId}/categories/${id}`,
} as const;

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  entriesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  entriesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parentId?: string;
}

function mapCategory(cat: CategoryResponse): Category {
  return {
    id: String(cat.id),
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    parentId: cat.parentId ? String(cat.parentId) : undefined,
    entriesCount: cat.entriesCount,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  };
}

/**
 * Get all categories for a content type
 * GET /api/workspaces/{workspaceId}/content-types/{contentTypeId}/categories
 */
export async function getCategories(contentTypeId: string): Promise<Category[]> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>(
      ENDPOINTS.LIST(workspaceId, contentTypeId)
    );
    return response.data.data.map(mapCategory);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Get a single category
 * GET /api/workspaces/{workspaceId}/content-types/{contentTypeId}/categories/{id}
 */
export async function getCategory(contentTypeId: string, id: string): Promise<Category | null> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<CategoryResponse>>(
      ENDPOINTS.GET(workspaceId, contentTypeId, id)
    );
    return mapCategory(response.data.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new category
 * POST /api/workspaces/{workspaceId}/content-types/{contentTypeId}/categories
 */
export async function createCategory(contentTypeId: string, data: CreateCategoryData): Promise<Category> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<CategoryResponse>>(
      ENDPOINTS.CREATE(workspaceId, contentTypeId),
      {
        name: data.name,
        description: data.description,
        parentId: data.parentId ? Number(data.parentId) : undefined,
      }
    );
    return mapCategory(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao criar categoria');
  }
}

/**
 * Update a category
 * PUT /api/workspaces/{workspaceId}/content-types/{contentTypeId}/categories/{id}
 */
export async function updateCategory(contentTypeId: string, id: string, data: UpdateCategoryData): Promise<Category> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.put<ApiResponse<CategoryResponse>>(
      ENDPOINTS.UPDATE(workspaceId, contentTypeId, id),
      {
        name: data.name,
        description: data.description,
        parentId: data.parentId ? Number(data.parentId) : undefined,
      }
    );
    return mapCategory(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar categoria');
  }
}

/**
 * Delete a category
 * DELETE /api/workspaces/{workspaceId}/content-types/{contentTypeId}/categories/{id}
 */
export async function deleteCategory(contentTypeId: string, id: string): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.delete(ENDPOINTS.DELETE(workspaceId, contentTypeId, id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir categoria');
  }
}

export const categoriesService = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
