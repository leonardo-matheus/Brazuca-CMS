import { apiClient, getErrorMessage } from '@/lib/api';
import { 
  ProjectSettings, 
  TeamMember, 
  TeamInvite, 
  BillingInfo, 
  Invoice, 
  Webhook, 
  Integration 
} from '@/types';

// =============================================
// Settings Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// =============================================

/**
 * API Endpoints - Spring Boot Backend
 */
const ENDPOINTS = {
  // General
  GENERAL: '/api/settings/general',
  // Team
  TEAM_LIST: '/api/settings/team',
  TEAM_INVITE: '/api/settings/team/invite',
  TEAM_UPDATE_ROLE: (id: string) => `/api/settings/team/${id}/role`,
  TEAM_REMOVE: (id: string) => `/api/settings/team/${id}`,
  // Billing
  BILLING: '/api/settings/billing',
  INVOICES: '/api/settings/billing/invoices',
  // Integrations
  WEBHOOKS: '/api/settings/webhooks',
  WEBHOOK_TEST: (id: string) => `/api/settings/webhooks/${id}/test`,
  INTEGRATIONS: '/api/settings/integrations',
} as const;

// Spring Boot response types
interface TeamMemberResponse {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  status: string;
  invitedAt?: string;
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface WebhookResponse {
  id: number;
  name: string;
  url: string;
  events: string[];
  status: string;
  lastTriggeredAt?: string;
  createdAt: string;
}

interface IntegrationResponse {
  id: number;
  name: string;
  type: string;
  status: string;
  config: any;
  lastTriggeredAt?: string;
  createdAt: string;
}

// ==================== General Settings ====================

/**
 * Get general settings
 * GET /api/settings/general
 */
export async function getGeneralSettings(): Promise<ProjectSettings> {
  try {
    const response = await apiClient.get<ProjectSettings>(ENDPOINTS.GENERAL);
    return response.data;
  } catch (error) {
    console.error('Error fetching general settings:', error);
    return {
      projectName: 'BrazucaCMS',
      description: 'CMS Headless',
      defaultLocale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      features: ['api', 'webhooks', 'cdn'],
    };
  }
}

/**
 * Update general settings
 * PUT /api/settings/general
 */
export async function updateGeneralSettings(data: Partial<ProjectSettings>): Promise<ProjectSettings> {
  try {
    const response = await apiClient.put<ProjectSettings>(ENDPOINTS.GENERAL, data);
    return response.data;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar configurações');
  }
}

// ==================== Team Settings ====================

function mapTeamMember(member: TeamMemberResponse): TeamMember {
  return {
    id: String(member.id),
    email: member.email,
    name: member.name,
    avatar: member.avatar,
    role: member.role as TeamMember['role'],
    status: member.status as TeamMember['status'],
    invitedAt: member.invitedAt,
    invitedBy: member.invitedBy,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

/**
 * Get team members
 * GET /api/settings/team
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const response = await apiClient.get<TeamMemberResponse[]>(ENDPOINTS.TEAM_LIST);
    return response.data.map(mapTeamMember);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

/**
 * Invite a team member
 * POST /api/settings/team/invite
 */
export async function inviteTeamMember(data: TeamInvite): Promise<TeamMember> {
  try {
    const response = await apiClient.post<TeamMemberResponse>(ENDPOINTS.TEAM_INVITE, data);
    return mapTeamMember(response.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao convidar membro');
  }
}

/**
 * Update team member role
 * PUT /api/settings/team/{id}/role
 */
export async function updateMemberRole(id: string, role: TeamMember['role']): Promise<TeamMember> {
  try {
    const response = await apiClient.put<TeamMemberResponse>(ENDPOINTS.TEAM_UPDATE_ROLE(id), { role });
    return mapTeamMember(response.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar função');
  }
}

/**
 * Remove team member
 * DELETE /api/settings/team/{id}
 */
export async function removeTeamMember(id: string): Promise<void> {
  try {
    await apiClient.delete(ENDPOINTS.TEAM_REMOVE(id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao remover membro');
  }
}

// ==================== Billing Settings ====================

/**
 * Get billing info
 * GET /api/settings/billing
 */
export async function getBillingInfo(): Promise<BillingInfo> {
  try {
    const response = await apiClient.get<BillingInfo>(ENDPOINTS.BILLING);
    return response.data;
  } catch (error) {
    console.error('Error fetching billing info:', error);
    // Return default/free plan
    return {
      plan: 'free',
      planName: 'Gratuito',
      price: 0,
      currency: 'BRL',
      billingCycle: 'monthly',
      nextBillingDate: '',
      status: 'active',
    };
  }
}

/**
 * Get invoices
 * GET /api/settings/billing/invoices
 */
export async function getInvoices(): Promise<Invoice[]> {
  try {
    const response = await apiClient.get<Invoice[]>(ENDPOINTS.INVOICES);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

// ==================== Integrations Settings ====================

function mapWebhook(webhook: WebhookResponse): Webhook {
  return {
    id: String(webhook.id),
    name: webhook.name,
    url: webhook.url,
    events: webhook.events,
    status: webhook.status as Webhook['status'],
    lastTriggeredAt: webhook.lastTriggeredAt,
    createdAt: webhook.createdAt,
  };
}

/**
 * Get webhooks
 * GET /api/settings/webhooks
 */
export async function getWebhooks(): Promise<Webhook[]> {
  try {
    const response = await apiClient.get<WebhookResponse[]>(ENDPOINTS.WEBHOOKS);
    return response.data.map(mapWebhook);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return [];
  }
}

/**
 * Create webhook
 * POST /api/settings/webhooks
 */
export async function createWebhook(data: Omit<Webhook, 'id' | 'createdAt' | 'lastTriggeredAt'>): Promise<Webhook> {
  try {
    const response = await apiClient.post<WebhookResponse>(ENDPOINTS.WEBHOOKS, data);
    return mapWebhook(response.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao criar webhook');
  }
}

/**
 * Delete webhook
 * DELETE /api/settings/webhooks/{id}
 */
export async function deleteWebhook(id: string): Promise<void> {
  try {
    await apiClient.delete(`${ENDPOINTS.WEBHOOKS}/${id}`);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir webhook');
  }
}

/**
 * Test webhook
 * POST /api/settings/webhooks/{id}/test
 */
export async function testWebhook(id: string): Promise<{ success: boolean; statusCode: number }> {
  try {
    const response = await apiClient.post<{ success: boolean; statusCode: number }>(ENDPOINTS.WEBHOOK_TEST(id));
    return response.data;
  } catch (error: any) {
    return { success: false, statusCode: 500 };
  }
}

function mapIntegration(integration: IntegrationResponse): Integration {
  return {
    id: String(integration.id),
    name: integration.name,
    type: integration.type as Integration['type'],
    status: integration.status as Integration['status'],
    config: integration.config,
    lastTriggeredAt: integration.lastTriggeredAt,
    createdAt: integration.createdAt,
  };
}

/**
 * Get integrations
 * GET /api/settings/integrations
 */
export async function getIntegrations(): Promise<Integration[]> {
  try {
    const response = await apiClient.get<IntegrationResponse[]>(ENDPOINTS.INTEGRATIONS);
    return response.data.map(mapIntegration);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return [];
  }
}

/**
 * Toggle integration status
 * POST /api/settings/integrations/{id}/toggle
 */
export async function toggleIntegration(id: string): Promise<Integration> {
  try {
    const response = await apiClient.post<IntegrationResponse>(`${ENDPOINTS.INTEGRATIONS}/${id}/toggle`);
    return mapIntegration(response.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao alternar integração');
  }
}

export const settingsService = {
  // General
  getGeneralSettings,
  updateGeneralSettings,
  // Team
  getTeamMembers,
  inviteTeamMember,
  updateMemberRole,
  removeTeamMember,
  // Billing
  getBillingInfo,
  getInvoices,
  // Integrations
  getWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
  getIntegrations,
  toggleIntegration,
};
