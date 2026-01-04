import { apiClient, getErrorMessage } from '@/lib/api';
import { useWorkspaceStore, waitForWorkspace } from '@/stores/workspace.store';

// =============================================
// Webhooks Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// Eventos: entry.created, entry.updated, entry.published, etc.
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
  LIST: (workspaceId: number) => `/api/workspaces/${workspaceId}/webhooks`,
  GET: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/webhooks/${id}`,
  CREATE: (workspaceId: number) => `/api/workspaces/${workspaceId}/webhooks`,
  UPDATE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/webhooks/${id}`,
  DELETE: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/webhooks/${id}`,
  TEST: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/webhooks/${id}/test`,
  LOGS: (workspaceId: number, id: string) => `/api/workspaces/${workspaceId}/webhooks/${id}/logs`,
} as const;

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface WebhookResponse {
  id: number;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  isActive: boolean;
  retryCount: number;
  successCount: number;
  failureCount: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

interface WebhookLogResponse {
  id: number;
  webhookId: number;
  event: string;
  payload: Record<string, any>;
  responseStatus: number;
  responseBody?: string;
  success: boolean;
  attempts: number;
  createdAt: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  active: boolean;
  retryCount: number;
  successCount: number;
  failureCount: number;
  lastTriggered?: string;
  lastDelivery?: {
    success: boolean;
    statusCode?: number;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  statusCode?: number;
  responseBody?: string;
  success: boolean;
  error?: string;
  duration?: number;
  timestamp: string;
}

export interface CreateWebhookData {
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  active?: boolean;
  retryCount?: number;
}

export interface UpdateWebhookData {
  name?: string;
  url?: string;
  events?: string[];
  headers?: Record<string, string>;
  secret?: string;
  active?: boolean;
  retryCount?: number;
}

// Available webhook events
export const WEBHOOK_EVENTS = [
  { value: 'entry.created', label: 'Entry Created', description: 'Quando uma nova entrada é criada', category: 'Entradas' },
  { value: 'entry.updated', label: 'Entry Updated', description: 'Quando uma entrada é atualizada', category: 'Entradas' },
  { value: 'entry.published', label: 'Entry Published', description: 'Quando uma entrada é publicada', category: 'Entradas' },
  { value: 'entry.unpublished', label: 'Entry Unpublished', description: 'Quando uma entrada é despublicada', category: 'Entradas' },
  { value: 'entry.scheduled', label: 'Entry Scheduled', description: 'Quando uma entrada é agendada', category: 'Entradas' },
  { value: 'entry.deleted', label: 'Entry Deleted', description: 'Quando uma entrada é excluída', category: 'Entradas' },
  { value: 'entry.archived', label: 'Entry Archived', description: 'Quando uma entrada é arquivada', category: 'Entradas' },
  { value: 'asset.uploaded', label: 'Asset Uploaded', description: 'Quando um arquivo é enviado', category: 'Mídia' },
  { value: 'asset.deleted', label: 'Asset Deleted', description: 'Quando um arquivo é excluído', category: 'Mídia' },
  { value: 'content_type.created', label: 'Content Type Created', description: 'Quando um tipo de conteúdo é criado', category: 'Tipos de Conteúdo' },
  { value: 'content_type.updated', label: 'Content Type Updated', description: 'Quando um tipo de conteúdo é atualizado', category: 'Tipos de Conteúdo' },
  { value: 'content_type.deleted', label: 'Content Type Deleted', description: 'Quando um tipo de conteúdo é excluído', category: 'Tipos de Conteúdo' },
] as const;

function mapWebhook(webhook: WebhookResponse): Webhook {
  return {
    id: String(webhook.id),
    name: webhook.name,
    url: webhook.url,
    events: webhook.events,
    headers: webhook.headers,
    active: webhook.isActive,
    retryCount: webhook.retryCount,
    successCount: webhook.successCount,
    failureCount: webhook.failureCount,
    lastTriggered: webhook.lastTriggered,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
  };
}

function mapWebhookLog(log: WebhookLogResponse): WebhookLog {
  return {
    id: String(log.id),
    webhookId: String(log.webhookId),
    event: log.event,
    payload: log.payload,
    statusCode: log.responseStatus,
    responseBody: log.responseBody,
    success: log.success,
    timestamp: log.createdAt,
  };
}

/**
 * Get all webhooks for the workspace
 * GET /api/workspaces/{workspaceId}/webhooks
 */
export async function getWebhooks(): Promise<Webhook[]> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<WebhookResponse[]>>(ENDPOINTS.LIST(workspaceId));
    return response.data.data.map(mapWebhook);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    throw error;
  }
}

/**
 * Get a single webhook
 * GET /api/workspaces/{workspaceId}/webhooks/{id}
 */
export async function getWebhook(id: string): Promise<Webhook | null> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<WebhookResponse>>(ENDPOINTS.GET(workspaceId, id));
    return mapWebhook(response.data.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new webhook
 * POST /api/workspaces/{workspaceId}/webhooks
 */
export async function createWebhook(data: CreateWebhookData): Promise<Webhook> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<WebhookResponse>>(ENDPOINTS.CREATE(workspaceId), {
      name: data.name,
      url: data.url,
      events: data.events,
      headers: data.headers,
      retryCount: data.retryCount || 3,
    });
    return mapWebhook(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao criar webhook');
  }
}

/**
 * Update a webhook
 * PUT /api/workspaces/{workspaceId}/webhooks/{id}
 */
export async function updateWebhook(id: string, data: UpdateWebhookData): Promise<Webhook> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.put<ApiResponse<WebhookResponse>>(ENDPOINTS.UPDATE(workspaceId, id), data);
    return mapWebhook(response.data.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar webhook');
  }
}

/**
 * Delete a webhook
 * DELETE /api/workspaces/{workspaceId}/webhooks/{id}
 */
export async function deleteWebhook(id: string): Promise<void> {
  try {
    const workspaceId = await getWorkspaceId();
    await apiClient.delete(ENDPOINTS.DELETE(workspaceId, id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir webhook');
  }
}

/**
 * Test a webhook
 * POST /api/workspaces/{workspaceId}/webhooks/{id}/test
 */
export async function testWebhook(id: string): Promise<{ success: boolean; statusCode: number; message: string }> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.post<ApiResponse<{ success: boolean; statusCode: number; message: string }>>(
      ENDPOINTS.TEST(workspaceId, id)
    );
    return response.data.data;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao testar webhook');
  }
}

/**
 * Get webhook logs
 * GET /api/workspaces/{workspaceId}/webhooks/{id}/logs
 */
export async function getWebhookLogs(id: string, params?: { page?: number; size?: number }): Promise<WebhookLog[]> {
  try {
    const workspaceId = await getWorkspaceId();
    const response = await apiClient.get<ApiResponse<WebhookLogResponse[]>>(ENDPOINTS.LOGS(workspaceId, id), {
      params: {
        page: (params?.page || 1) - 1,
        size: params?.size || 20,
      },
    });
    return response.data.data.map(mapWebhookLog);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao buscar logs do webhook');
  }
}

export const webhooksService = {
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookLogs,
  WEBHOOK_EVENTS,
};
