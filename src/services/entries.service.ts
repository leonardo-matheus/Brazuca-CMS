import { apiClient, getErrorMessage } from '@/lib/api';
import { ContentEntry, PaginatedResponse, PaginationParams } from '@/types';
import { useWorkspaceStore, waitForWorkspace } from '@/stores/workspace.store';

// =============================================
// Entries Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// Fluxo: draft → scheduled → published → archived
// =============================================

/**
 * Helper to get current workspace ID (waits for workspace to be ready)
 */
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

/**
 * API Endpoints - Spring Boot Backend
 */
const ENDPOINTS = {
  LIST: (workspaceId: number) => `/api/workspaces/${workspaceId}/entries`,
  GET: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/entries/${id}`,
  CREATE: (workspaceId: number) => `/api/workspaces/${workspaceId}/entries`,
  UPDATE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/entries/${id}`,
  DELETE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/entries/${id}`,
  PUBLISH: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/entries/${id}/publish`,
  UNPUBLISH: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/entries/${id}/unpublish`,
  SCHEDULE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/entries/${id}/schedule`,
  ARCHIVE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/entries/${id}/archive`,
  RESTORE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/entries/${id}/restore`,
  VERSIONS: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/entries/${id}/versions`,
  RESTORE_VERSION: (workspaceId: number, id: string, version: number) => 
    `/api/workspaces/${workspaceId}/entries/${id}/versions/${version}/restore`,
  BULK_DELETE: (workspaceId: number) => `/api/workspaces/${workspaceId}/entries/bulk-delete`,
  BULK_PUBLISH: (workspaceId: number) => `/api/workspaces/${workspaceId}/entries/bulk-publish`,
  BULK_ARCHIVE: (workspaceId: number) => `/api/workspaces/${workspaceId}/entries/bulk-archive`,
} as const;

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

interface EntryResponse {
  id: number;
  contentTypeId: number;
  contentTypeName: string;
  title: string;
  slug: string;
  status: string;
  data: Record<string, any>;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  version: number;
  publishedAt?: string;
  scheduledAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntryVersion {
  versionNumber: number;
  data: Record<string, any>;
  title: string;
  changeSummary: string;
  changedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

// Transform Spring Boot response to frontend format
function mapEntry(entry: EntryResponse): ContentEntry {
  return {
    id: String(entry.id),
    contentTypeId: String(entry.contentTypeId),
    contentTypeName: entry.contentTypeName,
    title: entry.title,
    slug: entry.slug,
    status: entry.status as ContentEntry['status'],
    data: entry.data || {},
    author: {
      id: String(entry.author?.id || ''),
      name: entry.author?.name || 'Desconhecido',
      avatar: entry.author?.avatar,
    },
    publishedAt: entry.publishedAt,
    scheduledAt: entry.scheduledAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export interface EntriesFilters extends PaginationParams {
  contentTypeId?: string;
  status?: ContentEntry['status'];
  authorId?: string;
  category?: string;
  tag?: string;
  fields?: string;
}

export interface CreateEntryData {
  contentTypeId: string;
  title: string;
  slug?: string;
  status?: 'draft' | 'published' | 'scheduled';
  data: Record<string, any>;
  scheduledAt?: string;
  categoryId?: string;
  tags?: string[];
}

export interface UpdateEntryData {
  title?: string;
  slug?: string;
  status?: 'draft' | 'published' | 'scheduled';
  data?: Record<string, any>;
  scheduledAt?: string;
  categoryId?: string;
  tags?: string[];
}

export interface PublishOptions {
  publishImmediately?: boolean;
  scheduledAt?: string;
}

/**
 * Get all entries with pagination and filters
 * GET /api/workspaces/{workspaceId}/entries
 */
export async function getEntries(params?: EntriesFilters): Promise<PaginatedResponse<ContentEntry>> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<SpringPageResponse<EntryResponse>>>(ENDPOINTS.LIST(workspaceId), {
      params: {
        page: (params?.page || 1) - 1,
        size: params?.perPage || 10,
        contentTypeId: params?.contentTypeId,
        status: params?.status,
        authorId: params?.authorId,
        category: params?.category,
        tag: params?.tag,
        search: params?.search,
        fields: params?.fields,
        sort: params?.sortBy ? `${params.sortBy},${params.sortOrder || 'desc'}` : 'updatedAt,desc',
      },
    });

    const data = response.data.data;

    return {
      items: data.content.map(mapEntry),
      total: data.totalElements,
      page: data.number + 1,
      perPage: data.size,
      totalPages: data.totalPages,
    };
  } catch (error) {
    console.error('Error fetching entries:', error);
    throw error;
  }
}

/**
 * Get a single entry by ID
 * GET /api/workspaces/{workspaceId}/entries/{id}
 */
export async function getEntry(id: string): Promise<ContentEntry | null> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<EntryResponse>>(ENDPOINTS.GET(workspaceId, id));
    return mapEntry(response.data.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new entry
 * POST /api/workspaces/{workspaceId}/entries
 */
export async function createEntry(data: CreateEntryData): Promise<ContentEntry> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<EntryResponse>>(ENDPOINTS.CREATE(workspaceId), {
      contentTypeId: Number(data.contentTypeId),
      title: data.title,
      slug: data.slug,
      status: data.status || 'draft',
      data: data.data,
      scheduledAt: data.scheduledAt,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      tags: data.tags,
    });
    return mapEntry(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao criar entrada');
  }
}

/**
 * Update an existing entry
 * PUT /api/workspaces/{workspaceId}/entries/{id}
 */
export async function updateEntry(id: string, data: UpdateEntryData): Promise<ContentEntry> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.put<ApiResponse<EntryResponse>>(ENDPOINTS.UPDATE(workspaceId, id), {
      title: data.title,
      slug: data.slug,
      status: data.status,
      data: data.data,
      scheduledAt: data.scheduledAt,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      tags: data.tags,
    });
    return mapEntry(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar entrada');
  }
}

/**
 * Delete an entry (soft delete)
 * DELETE /api/workspaces/{workspaceId}/entries/{id}
 */
export async function deleteEntry(id: string): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.delete(ENDPOINTS.DELETE(workspaceId, id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir entrada');
  }
}

/**
 * Publish an entry (immediately or scheduled)
 * POST /api/workspaces/{workspaceId}/entries/{id}/publish
 */
export async function publishEntry(id: string, options?: PublishOptions): Promise<ContentEntry> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<EntryResponse>>(ENDPOINTS.PUBLISH(workspaceId, id), {
      publishImmediately: options?.publishImmediately ?? true,
      scheduledAt: options?.scheduledAt,
    });
    return mapEntry(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao publicar entrada');
  }
}

/**
 * Schedule an entry for future publication
 * POST /api/workspaces/{workspaceId}/entries/{id}/schedule
 */
export async function scheduleEntry(id: string, scheduledAt: string): Promise<ContentEntry> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<EntryResponse>>(ENDPOINTS.SCHEDULE(workspaceId, id), {
      scheduledAt,
    });
    return mapEntry(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao agendar entrada');
  }
}

/**
 * Unpublish an entry (returns to draft)
 * POST /api/workspaces/{workspaceId}/entries/{id}/unpublish
 */
export async function unpublishEntry(id: string): Promise<ContentEntry> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<EntryResponse>>(ENDPOINTS.UNPUBLISH(workspaceId, id));
    return mapEntry(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao despublicar entrada');
  }
}

/**
 * Archive an entry
 * POST /api/workspaces/{workspaceId}/entries/{id}/archive
 */
export async function archiveEntry(id: string): Promise<ContentEntry> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<EntryResponse>>(ENDPOINTS.ARCHIVE(workspaceId, id));
    return mapEntry(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao arquivar entrada');
  }
}

/**
 * Restore an archived/deleted entry
 * POST /api/workspaces/{workspaceId}/entries/{id}/restore
 */
export async function restoreEntry(id: string): Promise<ContentEntry> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<EntryResponse>>(ENDPOINTS.RESTORE(workspaceId, id));
    return mapEntry(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao restaurar entrada');
  }
}

/**
 * Get version history for an entry
 * GET /api/workspaces/{workspaceId}/entries/{id}/versions
 */
export async function getEntryVersions(id: string): Promise<EntryVersion[]> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<EntryVersion[]>>(ENDPOINTS.VERSIONS(workspaceId, id));
    return response.data.data;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao buscar versões');
  }
}

/**
 * Restore a specific version
 * POST /api/workspaces/{workspaceId}/entries/{id}/versions/{version}/restore
 */
export async function restoreEntryVersion(id: string, versionNumber: number): Promise<ContentEntry> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<EntryResponse>>(
      ENDPOINTS.RESTORE_VERSION(workspaceId, id, versionNumber)
    );
    return mapEntry(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao restaurar versão');
  }
}

/**
 * Bulk delete entries
 * POST /api/workspaces/{workspaceId}/entries/bulk-delete
 */
export async function bulkDeleteEntries(ids: string[]): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.post(ENDPOINTS.BULK_DELETE(workspaceId), { ids: ids.map(Number) });
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir entradas em lote');
  }
}

/**
 * Bulk publish entries
 * POST /api/workspaces/{workspaceId}/entries/bulk-publish
 */
export async function bulkPublishEntries(ids: string[]): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.post(ENDPOINTS.BULK_PUBLISH(workspaceId), { ids: ids.map(Number) });
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao publicar entradas em lote');
  }
}

/**
 * Bulk archive entries
 * POST /api/workspaces/{workspaceId}/entries/bulk-archive
 */
export async function bulkArchiveEntries(ids: string[]): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.post(ENDPOINTS.BULK_ARCHIVE(workspaceId), { ids: ids.map(Number) });
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao arquivar entradas em lote');
  }
}

export const entriesService = {
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  publishEntry,
  scheduleEntry,
  unpublishEntry,
  archiveEntry,
  restoreEntry,
  getEntryVersions,
  restoreEntryVersion,
  bulkDeleteEntries,
  bulkPublishEntries,
  bulkArchiveEntries,
};
