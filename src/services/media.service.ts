import { apiClient, apiGet, apiPost, apiDelete, apiUpload, getErrorMessage } from '@/lib/api';
import {
  MediaFile,
  MediaFolder,
  PaginatedResponse,
  PaginationParams,
} from '@/types';
import { useWorkspaceStore, waitForWorkspace } from '@/stores/workspace.store';

// =============================================
// Media Service - Integração com Spring Boot
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
const MEDIA_ENDPOINTS = {
  FILES: (workspaceId: number) => `/api/workspaces/${workspaceId}/media`,
  FILE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/media/${id}`,
  UPLOAD: (workspaceId: number) => `/api/workspaces/${workspaceId}/media`,
  DOWNLOAD: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/media/${id}/download`,
  FOLDERS: (workspaceId: number) => `/api/workspaces/${workspaceId}/media/folders`,
  FOLDER: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/media/folders/${id}`,
  STORAGE: (workspaceId: number) => `/api/workspaces/${workspaceId}/media/storage`,
} as const;

// =============================================
// Media Files
// =============================================

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

interface MediaResponse {
  id: number;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
  folder?: string;
  uploadedBy: {
    id: number;
    name: string;
  };
  createdAt: string;
}

// Transform Spring Boot response to frontend format
function mapMediaFile(media: MediaResponse): MediaFile {
  return {
    id: String(media.id),
    name: media.filename,
    originalName: media.originalFilename,
    mimeType: media.contentType,
    size: media.size,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    width: media.width,
    height: media.height,
    alt: media.alt,
    folder: media.folder,
    uploadedBy: {
      id: String(media.uploadedBy?.id || ''),
      name: media.uploadedBy?.name || 'Desconhecido',
    },
    createdAt: media.createdAt,
  };
}

/**
 * Get all media files with pagination
 * GET /api/workspaces/{workspaceId}/media
 */
export async function getMediaFiles(
  params?: PaginationParams & { folder?: string; mimeType?: string }
): Promise<PaginatedResponse<MediaFile>> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<SpringPageResponse<MediaResponse>>>(MEDIA_ENDPOINTS.FILES(workspaceId), {
      params: {
        page: (params?.page || 1) - 1,
        size: params?.perPage || 12,
        folder: params?.folder,
        mimeType: params?.mimeType,
        search: params?.search,
      },
    });

    const data = response.data.data;

    return {
      items: data.content.map(mapMediaFile),
      total: data.totalElements,
      page: data.number + 1,
      perPage: data.size,
      totalPages: data.totalPages,
    };
  } catch (error) {
    console.error('Error fetching media:', error);
    throw error;
  }
}

/**
 * Get single media file
 * GET /api/workspaces/{workspaceId}/media/{id}
 */
export async function getMediaFile(id: string): Promise<MediaFile> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<MediaResponse>>(MEDIA_ENDPOINTS.FILE(workspaceId, id));
    return mapMediaFile(response.data.data);
  } catch (error) {
    console.error('Error fetching media file:', error);
    throw error;
  }
}

/**
 * Upload media file(s)
 * POST /api/workspaces/{workspaceId}/media
 */
export async function uploadMedia(
  files: File | File[],
  folder?: string
): Promise<MediaFile[]> {
  try {
    const workspaceId = await getWorkspaceId();
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];
    
    fileArray.forEach((file) => {
      formData.append('file', file);
    });
    
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await apiClient.post<ApiResponse<MediaResponse | MediaResponse[]>>(
      MEDIA_ENDPOINTS.UPLOAD(workspaceId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const responseData = response.data.data;
    const data = Array.isArray(responseData) ? responseData : [responseData];
    return data.map(mapMediaFile);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao fazer upload');
  }
}

/**
 * Delete media file
 * DELETE /api/workspaces/{workspaceId}/media/{id}
 */
export async function deleteMediaFile(id: string): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.delete(MEDIA_ENDPOINTS.FILE(workspaceId, id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir arquivo');
  }
}

/**
 * Bulk delete media files
 * POST /api/workspaces/{workspaceId}/media/bulk-delete
 */
export async function bulkDeleteMedia(ids: string[]): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.post(`/api/workspaces/${workspaceId}/media/bulk-delete`, { ids: ids.map(Number) });
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir arquivos em lote');
  }
}

/**
 * Update media file metadata
 * PUT /api/workspaces/{workspaceId}/media/{id}
 */
export async function updateMediaFile(
  id: string,
  data: Partial<Pick<MediaFile, 'name' | 'alt' | 'folder'>>
): Promise<MediaFile> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.put<ApiResponse<MediaResponse>>(MEDIA_ENDPOINTS.FILE(workspaceId, id), {
      filename: data.name,
      alt: data.alt,
      folder: data.folder,
    });
    return mapMediaFile(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar arquivo');
  }
}

// =============================================
// Media Folders
// =============================================

interface FolderResponse {
  id: number;
  name: string;
  parentId?: number;
  path: string;
  fileCount: number;
}

function mapFolder(folder: FolderResponse): MediaFolder {
  return {
    id: String(folder.id),
    name: folder.name,
    parentId: folder.parentId ? String(folder.parentId) : undefined,
    path: folder.path,
    fileCount: folder.fileCount,
  };
}

/**
 * Get all media folders
 * GET /api/workspaces/{workspaceId}/media/folders
 */
export async function getMediaFolders(): Promise<MediaFolder[]> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<FolderResponse[]>>(MEDIA_ENDPOINTS.FOLDERS(workspaceId));
    return response.data.data.map(mapFolder);
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
}

/**
 * Create media folder
 * POST /api/workspaces/{workspaceId}/media/folders
 */
export async function createMediaFolder(name: string, parentId?: string): Promise<MediaFolder> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<FolderResponse>>(MEDIA_ENDPOINTS.FOLDERS(workspaceId), {
      name,
      parentId: parentId ? Number(parentId) : undefined,
    });
    return mapFolder(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao criar pasta');
  }
}

/**
 * Delete media folder
 * DELETE /api/workspaces/{workspaceId}/media/folders/{id}
 */
export async function deleteMediaFolder(id: string): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.delete(MEDIA_ENDPOINTS.FOLDER(workspaceId, id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir pasta');
  }
}

// =============================================
// Storage
// =============================================

/**
 * Get storage usage info
 * GET /api/workspaces/{workspaceId}/media/storage
 */
export async function getStorageInfo(): Promise<{ used: number; limit: number }> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<{ used: number; limit: number }>>(MEDIA_ENDPOINTS.STORAGE(workspaceId));
    return response.data.data;
  } catch (error) {
    console.error('Error fetching storage info:', error);
    // Return default values on error
    return {
      used: 0,
      limit: 5 * 1024 * 1024 * 1024, // 5 GB default
    };
  }
}

// Export service object for convenience
export const mediaService = {
  getMediaFiles,
  getMediaFile,
  uploadMedia,
  deleteMediaFile,
  updateMediaFile,
  bulkDeleteMedia,
  getFolders: getMediaFolders,
  createFolder: createMediaFolder,
  deleteFolder: deleteMediaFolder,
  getStorageInfo,
};
