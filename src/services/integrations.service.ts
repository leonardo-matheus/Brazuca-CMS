import { apiClient } from '@/lib/api';

export interface Integration {
  id: number;
  platform: string;
  name: string;
  status: 'ACTIVE' | 'DISABLED' | 'ERROR' | 'EXPIRED';
  category: string;
  categoryName: string;
  connectedAt: string;
  lastSyncAt?: string;
  totalSyncs: number;
  totalItemsSynced: number;
  webhookConfigured: boolean;
  config?: Record<string, any>;
}

export interface Platform {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  description: string;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ERROR';
  triggerType: string;
  triggerEvent?: string;
  triggerIntegrationId?: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt?: string;
  createdAt: string;
}

export interface WorkflowCreateRequest {
  name: string;
  description?: string;
  trigger: {
    type: string;
    event?: string;
    integrationId?: number;
    filter?: Record<string, any>;
  };
  actions: Array<{
    type: string;
    integrationId?: number;
    config?: Record<string, any>;
  }>;
}

export interface IntegrationConnectRequest {
  platform: string;
  name?: string;
  code?: string;
  redirectUri?: string;
  apiKey?: string;
  apiSecret?: string;
  config?: Record<string, any>;
}

export interface IntegrationStats {
  totalIntegrations: number;
  activeIntegrations: number;
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions30d: number;
  successfulExecutions30d: number;
  syncedProducts: number;
}

export interface SyncedProduct {
  id: number;
  platform: string;
  externalId: string;
  title: string;
  description?: string;
  handle?: string;
  status: string;
  price?: number;
  compareAtPrice?: number;
  currency: string;
  sku?: string;
  inventoryQuantity?: number;
  images?: string[];
  categories?: string[];
  lastSyncedAt: string;
}

class IntegrationsService {
  // ============ Platforms ============
  
  async getAvailablePlatforms(): Promise<Platform[]> {
    const response = await apiClient.get('/integrations/platforms');
    return response.data.data;
  }

  // ============ Integrations ============
  
  async getIntegrations(category?: string): Promise<Integration[]> {
    const params = category ? { category } : {};
    const response = await apiClient.get('/integrations', { params });
    return response.data.data;
  }

  async getIntegration(id: number): Promise<Integration> {
    const response = await apiClient.get(`/integrations/${id}`);
    return response.data.data;
  }

  async connectIntegration(data: IntegrationConnectRequest): Promise<Integration> {
    const response = await apiClient.post('/integrations/connect', data);
    return response.data.data;
  }

  async disconnectIntegration(id: number): Promise<void> {
    await apiClient.delete(`/integrations/${id}`);
  }

  async syncIntegration(id: number): Promise<Record<string, any>> {
    const response = await apiClient.post(`/integrations/${id}/sync`);
    return response.data.data;
  }

  // ============ OAuth URLs ============
  
  async getGitHubOAuthUrl(redirectUri: string, state?: string): Promise<string> {
    const params = { redirectUri, state: state || '' };
    const response = await apiClient.get('/integrations/oauth/github', { params });
    return response.data.data.url;
  }

  async getShopifyOAuthUrl(shopDomain: string, redirectUri: string, state?: string): Promise<string> {
    const params = { shopDomain, redirectUri, state: state || '' };
    const response = await apiClient.get('/integrations/oauth/shopify', { params });
    return response.data.data.url;
  }

  async getAuth0OAuthUrl(domain: string | undefined, redirectUri: string, state?: string): Promise<string> {
    const params = { domain, redirectUri, state: state || '' };
    const response = await apiClient.get('/integrations/oauth/auth0', { params });
    return response.data.data.url;
  }

  // ============ Platform-Specific ============

  async getGitHubRepos(integrationId: number): Promise<any[]> {
    const response = await apiClient.get(`/integrations/github/${integrationId}/repos`);
    return response.data.data;
  }

  async getShopifyProducts(integrationId: number, page = 0, size = 20): Promise<{ content: SyncedProduct[]; totalElements: number }> {
    const response = await apiClient.get(`/integrations/shopify/${integrationId}/products`, {
      params: { page, size }
    });
    return response.data.data;
  }

  async getKlaviyoLists(integrationId: number): Promise<any[]> {
    const response = await apiClient.get(`/integrations/klaviyo/${integrationId}/lists`);
    return response.data.data;
  }

  // ============ Workflows ============

  async getWorkflows(status?: string): Promise<Workflow[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get('/integrations/workflows', { params });
    return response.data.data;
  }

  async createWorkflow(data: WorkflowCreateRequest): Promise<Workflow> {
    const response = await apiClient.post('/integrations/workflows', data);
    return response.data.data;
  }

  async activateWorkflow(id: number): Promise<Workflow> {
    const response = await apiClient.post(`/integrations/workflows/${id}/activate`);
    return response.data.data;
  }

  async pauseWorkflow(id: number): Promise<Workflow> {
    const response = await apiClient.post(`/integrations/workflows/${id}/pause`);
    return response.data.data;
  }

  async executeWorkflow(id: number, triggerData?: Record<string, any>): Promise<Record<string, any>> {
    const response = await apiClient.post(`/integrations/workflows/${id}/execute`, triggerData || {});
    return response.data.data;
  }

  async deleteWorkflow(id: number): Promise<void> {
    await apiClient.delete(`/integrations/workflows/${id}`);
  }

  // ============ Stats ============

  async getStats(): Promise<IntegrationStats> {
    const response = await apiClient.get('/integrations/stats');
    return response.data.data;
  }
}

export const integrationsService = new IntegrationsService();
