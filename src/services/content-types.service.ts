import { apiClient, apiGet, apiPost, apiPut, apiDelete, getErrorMessage } from '@/lib/api';
import { ContentType, ContentField, PaginatedResponse, PaginationParams } from '@/types';
import { useWorkspaceStore, waitForWorkspace } from '@/stores/workspace.store';

// =============================================
// Content Types Service - Integração com Spring Boot
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
  LIST: (workspaceId: number) => `/api/workspaces/${workspaceId}/content-types`,
  GET: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/content-types/${id}`,
  CREATE: (workspaceId: number) => `/api/workspaces/${workspaceId}/content-types`,
  UPDATE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/content-types/${id}`,
  DELETE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/content-types/${id}`,
} as const;

// Field type options for creating/editing content types
export const FIELD_TYPES = [
  { value: 'text', label: 'Text', description: 'Short text, titles, names' },
  { value: 'richtext', label: 'Rich Text', description: 'Formatted content with HTML' },
  { value: 'number', label: 'Number', description: 'Integer or decimal numbers' },
  { value: 'boolean', label: 'Boolean', description: 'True/False toggle' },
  { value: 'date', label: 'Date', description: 'Date and time picker' },
  { value: 'media', label: 'Media', description: 'Images, videos, files' },
  { value: 'relation', label: 'Relation', description: 'Link to other content' },
  { value: 'json', label: 'JSON', description: 'Raw JSON data' },
] as const;

// Spring Boot response types
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface SpringPageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ContentTypeResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  fields: ContentFieldResponse[] | string; // Can be JSON string or array
  createdAt: string;
  updatedAt: string;
}

interface ContentFieldResponse {
  id: number;
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  defaultValue?: any;
  validation?: any;
}

// Transform Spring Boot response to frontend format
function mapContentType(ct: ContentTypeResponse): ContentType {
  // Parse fields if it's a JSON string (backend stores as JSON string)
  let fields: ContentFieldResponse[] = [];
  if (ct.fields) {
    if (typeof ct.fields === 'string') {
      try {
        fields = JSON.parse(ct.fields);
      } catch (e) {
        console.error('Error parsing fields JSON:', e);
        fields = [];
      }
    } else if (Array.isArray(ct.fields)) {
      fields = ct.fields;
    }
  }

  return {
    id: String(ct.id),
    name: ct.name,
    slug: ct.slug,
    description: ct.description,
    fields: fields.map((f, index) => ({
      id: f.id ? String(f.id) : String(index),
      name: f.name,
      type: f.type as ContentField['type'],
      required: f.required || false,
      unique: f.unique || false,
      defaultValue: f.defaultValue,
      validation: f.validation,
    })),
    createdAt: ct.createdAt,
    updatedAt: ct.updatedAt,
  };
}

/**
 * Get all content types with pagination
 * GET /api/content-types
 */
export async function getContentTypes(params?: PaginationParams): Promise<PaginatedResponse<ContentType>> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<SpringPageResponse<ContentTypeResponse>>>(ENDPOINTS.LIST(workspaceId), {
      params: {
        page: (params?.page || 1) - 1, // Spring Boot uses 0-based pagination
        size: params?.perPage || 10,
        search: params?.search,
        sort: params?.sortBy ? `${params.sortBy},${params.sortOrder || 'asc'}` : undefined,
      },
    });

    const data = response.data.data;

    return {
      items: data.content.map(mapContentType),
      total: data.totalElements,
      page: data.number + 1, // Convert back to 1-based
      perPage: data.size,
      totalPages: data.totalPages,
    };
  } catch (error) {
    console.error('Error fetching content types:', error);
    throw error;
  }
}

/**
 * Get a single content type by ID
 * GET /api/content-types/{id}
 */
export async function getContentType(id: string): Promise<ContentType | null> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<ContentTypeResponse>>(ENDPOINTS.GET(workspaceId, id));
    return mapContentType(response.data.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new content type
 * POST /api/content-types
 */
export async function createContentType(data: Omit<ContentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentType> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<ContentTypeResponse>>(ENDPOINTS.CREATE(workspaceId), {
      name: data.name,
      slug: data.slug,
      description: data.description,
      fields: data.fields?.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required,
        unique: f.unique,
        defaultValue: f.defaultValue,
      })),
    });
    return mapContentType(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao criar tipo de conteúdo');
  }
}

/**
 * Update an existing content type
 * PUT /api/content-types/{id}
 */
export async function updateContentType(id: string, data: Partial<ContentType>): Promise<ContentType> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.put<ApiResponse<ContentTypeResponse>>(ENDPOINTS.UPDATE(workspaceId, id), {
      name: data.name,
      slug: data.slug,
      description: data.description,
      fields: data.fields?.map(f => ({
        id: f.id && !isNaN(Number(f.id)) ? Number(f.id) : undefined,
        name: f.name,
        type: f.type,
        required: f.required,
        unique: f.unique,
        defaultValue: f.defaultValue,
      })),
    });
    return mapContentType(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar tipo de conteúdo');
  }
}

/**
 * Delete a content type
 * DELETE /api/content-types/{id}
 */
export async function deleteContentType(id: string): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.delete(ENDPOINTS.DELETE(workspaceId, id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir tipo de conteúdo');
  }
}

export const contentTypesService = {
  getContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  deleteContentType,
  FIELD_TYPES,
};
