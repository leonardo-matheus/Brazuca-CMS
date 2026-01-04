import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import {
  ContentEntry,
  ContentType,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

// =============================================
// Content Service
// Handles all content-related API calls
// =============================================

/**
 * API Endpoints - Update these with your actual backend routes
 */
const CONTENT_ENDPOINTS = {
  // Content Types
  CONTENT_TYPES: '/content-types',
  CONTENT_TYPE: (id: string) => `/content-types/${id}`,
  
  // Content Entries
  ENTRIES: '/entries',
  ENTRY: (id: string) => `/entries/${id}`,
  ENTRIES_BY_TYPE: (typeId: string) => `/content-types/${typeId}/entries`,
  PUBLISH: (id: string) => `/entries/${id}/publish`,
  UNPUBLISH: (id: string) => `/entries/${id}/unpublish`,
} as const;

// =============================================
// Content Types
// =============================================

/**
 * Get all content types
 */
export async function getContentTypes(): Promise<ContentType[]> {
  // TODO: Implement actual API call
  // return apiGet(CONTENT_ENDPOINTS.CONTENT_TYPES);
  
  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          name: 'Blog Post',
          slug: 'blog',
          description: 'Artigos do blog',
          fields: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Página',
          slug: 'page',
          description: 'Páginas estáticas',
          fields: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Produto',
          slug: 'product',
          description: 'Catálogo de produtos',
          fields: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }, 500);
  });
}

/**
 * Get single content type
 */
export async function getContentType(id: string): Promise<ContentType> {
  // TODO: Implement actual API call
  // return apiGet(CONTENT_ENDPOINTS.CONTENT_TYPE(id));
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        name: 'Blog Post',
        slug: 'blog',
        fields: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  });
}

/**
 * Create content type
 */
export async function createContentType(data: Partial<ContentType>): Promise<ContentType> {
  // TODO: Implement actual API call
  // return apiPost(CONTENT_ENDPOINTS.CONTENT_TYPES, data);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Date.now().toString(),
        name: data.name || '',
        slug: data.slug || '',
        fields: data.fields || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  });
}

/**
 * Update content type
 */
export async function updateContentType(id: string, data: Partial<ContentType>): Promise<ContentType> {
  // TODO: Implement actual API call
  // return apiPut(CONTENT_ENDPOINTS.CONTENT_TYPE(id), data);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        name: data.name || '',
        slug: data.slug || '',
        fields: data.fields || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  });
}

/**
 * Delete content type
 */
export async function deleteContentType(id: string): Promise<void> {
  // TODO: Implement actual API call
  // return apiDelete(CONTENT_ENDPOINTS.CONTENT_TYPE(id));
  
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}

// =============================================
// Content Entries
// =============================================

/**
 * Get all content entries with pagination
 */
export async function getEntries(
  params?: PaginationParams & { contentTypeId?: string; status?: string }
): Promise<PaginatedResponse<ContentEntry>> {
  // TODO: Implement actual API call
  // return apiGet(CONTENT_ENDPOINTS.ENTRIES, params);
  
  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        items: [
          {
            id: '1',
            contentTypeId: '1',
            contentTypeName: 'Blog',
            title: 'Como usar a API REST',
            slug: '/blog/como-usar-api-rest',
            status: 'published',
            data: {},
            author: { id: '1', name: 'João Silva' },
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            updatedAt: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: '2',
            contentTypeId: '2',
            contentTypeName: 'Página',
            title: 'Página Sobre Nós',
            slug: '/pages/sobre-nos',
            status: 'published',
            data: {},
            author: { id: '2', name: 'Maria Costa' },
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            contentTypeId: '1',
            contentTypeName: 'Blog',
            title: 'Guia de Integração',
            slug: '/docs/integracao',
            status: 'draft',
            data: {},
            author: { id: '3', name: 'Pedro Oliveira' },
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            updatedAt: new Date(Date.now() - 259200000).toISOString(),
          },
          {
            id: '4',
            contentTypeId: '3',
            contentTypeName: 'Produto',
            title: 'Produto: CMS Pro',
            slug: '/produtos/cms-pro',
            status: 'published',
            data: {},
            author: { id: '4', name: 'Ana Santos' },
            createdAt: new Date(Date.now() - 604800000).toISOString(),
            updatedAt: new Date(Date.now() - 604800000).toISOString(),
          },
          {
            id: '5',
            contentTypeId: '2',
            contentTypeName: 'Página',
            title: 'Política de Privacidade',
            slug: '/pages/privacidade',
            status: 'published',
            data: {},
            author: { id: '1', name: 'João Silva' },
            createdAt: new Date(Date.now() - 1209600000).toISOString(),
            updatedAt: new Date(Date.now() - 1209600000).toISOString(),
          },
        ],
        total: 12,
        page: params?.page || 1,
        perPage: params?.perPage || 10,
        totalPages: 2,
      });
    }, 500);
  });
}

/**
 * Get single content entry
 */
export async function getEntry(id: string): Promise<ContentEntry> {
  // TODO: Implement actual API call
  // return apiGet(CONTENT_ENDPOINTS.ENTRY(id));
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        contentTypeId: '1',
        contentTypeName: 'Blog',
        title: 'Como usar a API REST',
        slug: '/blog/como-usar-api-rest',
        status: 'published',
        data: {},
        author: { id: '1', name: 'João Silva' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  });
}

/**
 * Create content entry
 */
export async function createEntry(data: Partial<ContentEntry>): Promise<ContentEntry> {
  // TODO: Implement actual API call
  // return apiPost(CONTENT_ENDPOINTS.ENTRIES, data);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Date.now().toString(),
        contentTypeId: data.contentTypeId || '1',
        contentTypeName: data.contentTypeName || 'Blog',
        title: data.title || '',
        slug: data.slug || '',
        status: 'draft',
        data: data.data || {},
        author: { id: '1', name: 'João Silva' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  });
}

/**
 * Update content entry
 */
export async function updateEntry(id: string, data: Partial<ContentEntry>): Promise<ContentEntry> {
  // TODO: Implement actual API call
  // return apiPut(CONTENT_ENDPOINTS.ENTRY(id), data);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        contentTypeId: data.contentTypeId || '1',
        contentTypeName: data.contentTypeName || 'Blog',
        title: data.title || '',
        slug: data.slug || '',
        status: data.status || 'draft',
        data: data.data || {},
        author: { id: '1', name: 'João Silva' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  });
}

/**
 * Delete content entry
 */
export async function deleteEntry(id: string): Promise<void> {
  // TODO: Implement actual API call
  // return apiDelete(CONTENT_ENDPOINTS.ENTRY(id));
  
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}

/**
 * Publish content entry
 */
export async function publishEntry(id: string): Promise<ContentEntry> {
  // TODO: Implement actual API call
  // return apiPost(CONTENT_ENDPOINTS.PUBLISH(id));
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        contentTypeId: '1',
        contentTypeName: 'Blog',
        title: 'Como usar a API REST',
        slug: '/blog/como-usar-api-rest',
        status: 'published',
        data: {},
        author: { id: '1', name: 'João Silva' },
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  });
}

/**
 * Unpublish content entry
 */
export async function unpublishEntry(id: string): Promise<ContentEntry> {
  // TODO: Implement actual API call
  // return apiPost(CONTENT_ENDPOINTS.UNPUBLISH(id));
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        contentTypeId: '1',
        contentTypeName: 'Blog',
        title: 'Como usar a API REST',
        slug: '/blog/como-usar-api-rest',
        status: 'draft',
        data: {},
        author: { id: '1', name: 'João Silva' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  });
}

// Export service object for convenience
export const contentService = {
  getContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  deleteContentType,
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  publishEntry,
  unpublishEntry,
};
