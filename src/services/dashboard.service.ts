import { apiClient, getErrorMessage, ApiResponse } from '@/lib/api';
import {
  User,
  Project,
  ProjectSettings,
  NotificationSettings,
  TeamMember,
  TeamInvite,
  DashboardStats,
  ActivityLog,
  ApiKey,
  PaginatedResponse,
  RecentActivity,
} from '@/types';

// =============================================
// Dashboard Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// =============================================

/**
 * API Endpoints - Spring Boot Backend
 */
const DASHBOARD_ENDPOINTS = {
  STATS: '/api/dashboard/stats',
  PROJECT: '/api/settings/general',
  NOTIFICATIONS: '/api/settings/notifications',
  API_KEYS: '/api/api-keys',
  API_KEY: (id: string) => `/api/api-keys/${id}`,
  TEAM: '/api/settings/team',
  TEAM_MEMBER: (id: string) => `/api/settings/team/${id}`,
  TEAM_INVITE: '/api/settings/team/invite',
} as const;

// Spring Boot response types - matches DashboardStats DTO
interface DashboardStatsResponse {
  totalEntries: number;
  publishedEntries: number;
  draftEntries: number;
  totalContentTypes: number;
  totalMedia: number;
  totalApiKeys: number;
  totalUsers: number;
  contentTypeStats: Array<{
    id: number;
    name: string;
    slug: string;
    entriesCount: number;
  }>;
  recentActivities: Array<{
    type: string;
    title: string;
    description: string;
    userName: string;
    timestamp: string;
  }>;
  entriesByStatus: Record<string, number>;
  entriesByMonth: Record<string, number>;
}

// Cached stats for getRecentActivity to use
let cachedStats: DashboardStats | null = null;

// =============================================
// Dashboard
// =============================================

/**
 * Get dashboard statistics
 * GET /api/dashboard/stats
 * 
 * Backend Response: ApiResponse<DashboardStats>
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    console.log('[Dashboard] Fetching stats...');
    const response = await apiClient.get<ApiResponse<DashboardStatsResponse>>(DASHBOARD_ENDPOINTS.STATS);
    
    console.log('[Dashboard] Stats response:', response.data);
    
    // Handle ApiResponse wrapper
    const apiResponse = response.data;
    if (apiResponse.success && apiResponse.data) {
      const backendData = apiResponse.data;
      
      // Map backend response to frontend DashboardStats
      const stats: DashboardStats = {
        totalEntries: backendData.totalEntries || 0,
        publishedEntries: backendData.publishedEntries || 0,
        draftEntries: backendData.draftEntries || 0,
        totalContentTypes: backendData.totalContentTypes || 0,
        totalMedia: backendData.totalMedia || 0,
        totalApiKeys: backendData.totalApiKeys || 0,
        totalUsers: backendData.totalUsers || 0,
        contentTypeStats: backendData.contentTypeStats || [],
        recentActivities: backendData.recentActivities || [],
        entriesByStatus: backendData.entriesByStatus || {},
        entriesByMonth: backendData.entriesByMonth || {},
        // Computed/legacy fields for frontend compatibility
        entriesChange: 0,
        apiRequests: 0,
        apiRequestsChange: 0,
        storageUsed: 0,
        storageLimit: 10,
        teamMembers: backendData.totalUsers || 1,
        teamMembersChange: 0,
      };
      
      // Cache stats for getRecentActivity
      cachedStats = stats;
      
      return stats;
    }
    
    // Fallback if response doesn't match expected format
    return response.data as unknown as DashboardStats;
  } catch (error) {
    console.error('[Dashboard] Error fetching stats:', error);
    // Return default values on error
    return {
      totalEntries: 0,
      publishedEntries: 0,
      draftEntries: 0,
      totalContentTypes: 0,
      totalMedia: 0,
      totalApiKeys: 0,
      totalUsers: 0,
      contentTypeStats: [],
      recentActivities: [],
      entriesByStatus: {},
      entriesByMonth: {},
      entriesChange: 0,
      apiRequests: 0,
      apiRequestsChange: 0,
      storageUsed: 0,
      storageLimit: 10,
      teamMembers: 1,
      teamMembersChange: 0,
    };
  }
}

/**
 * Get recent activity
 * Note: Backend returns recentActivities inside stats, not as separate endpoint
 * This function uses cached stats or fetches fresh stats if needed
 */
export async function getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
  try {
    console.log('[Dashboard] Getting recent activity from stats...');
    
    // Use cached stats or fetch fresh
    let stats = cachedStats;
    if (!stats) {
      stats = await getDashboardStats();
    }
    
    const recentActivities = stats.recentActivities || [];
    
    // Map backend RecentActivity to frontend ActivityLog format
    return recentActivities.slice(0, limit).map((activity, index) => ({
      id: String(index + 1),
      action: mapActivityType(activity.type),
      entityType: 'content' as const,
      entityId: String(index + 1),
      entityName: activity.title,
      user: {
        id: '0',
        name: activity.userName,
        avatar: undefined,
      },
      metadata: { description: activity.description },
      createdAt: activity.timestamp,
    }));
  } catch (error) {
    console.error('[Dashboard] Error getting activity:', error);
    return [];
  }
}

/**
 * Map backend activity type to frontend action
 */
function mapActivityType(type: string): ActivityLog['action'] {
  const typeMap: Record<string, ActivityLog['action']> = {
    'ENTRY_CREATED': 'create',
    'ENTRY_UPDATED': 'update',
    'ENTRY_PUBLISHED': 'publish',
    'ENTRY_DELETED': 'delete',
    'ENTRY_UNPUBLISHED': 'unpublish',
    'MEDIA_UPLOADED': 'create',
  };
  return typeMap[type] || 'create';
}

// =============================================
// Project Settings
// =============================================

interface ProjectSettingsResponse {
  projectName: string;
  description: string;
  defaultLocale: string;
  timezone: string;
  features: string[];
}

/**
 * Get project settings
 * GET /api/settings/general
 */
export async function getProjectSettings(): Promise<ProjectSettings> {
  try {
    const response = await apiClient.get<ApiResponse<ProjectSettingsResponse>>(DASHBOARD_ENDPOINTS.PROJECT);
    
    const apiResponse = response.data;
    if (apiResponse.success && apiResponse.data) {
      return apiResponse.data;
    }
    
    return response.data as unknown as ProjectSettings;
  } catch (error) {
    console.error('[Dashboard] Error fetching project settings:', error);
    return {
      projectName: 'BrazucaCMS',
      description: 'CMS Headless',
      defaultLocale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      features: ['api', 'media', 'webhooks'],
    };
  }
}

/**
 * Update project settings
 * PUT /api/settings/general
 */
export async function updateProjectSettings(data: Partial<ProjectSettings>): Promise<ProjectSettings> {
  try {
    const response = await apiClient.put<ProjectSettingsResponse>(DASHBOARD_ENDPOINTS.PROJECT, data);
    return response.data;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar configurações');
  }
}

// =============================================
// Notification Settings
// =============================================

/**
 * Get notification settings
 * GET /api/settings/notifications
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const response = await apiClient.get<NotificationSettings>(DASHBOARD_ENDPOINTS.NOTIFICATIONS);
    return response.data;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return {
      emailNotifications: true,
      securityAlerts: true,
      productUpdates: false,
      newsletter: false,
    };
  }
}

/**
 * Update notification settings
 * PUT /api/settings/notifications
 */
export async function updateNotificationSettings(
  data: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  try {
    const response = await apiClient.put<NotificationSettings>(DASHBOARD_ENDPOINTS.NOTIFICATIONS, data);
    return response.data;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar notificações');
  }
}

// =============================================
// Security Settings
// =============================================

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  activeSessions: number;
}

/**
 * Get security settings
 * GET /api/settings/security
 */
export async function getSecuritySettings(): Promise<SecuritySettings> {
  try {
    const response = await apiClient.get<SecuritySettings>('/api/settings/security');
    return response.data;
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return {
      twoFactorEnabled: false,
      lastPasswordChange: new Date().toISOString(),
      activeSessions: 1,
    };
  }
}

/**
 * Update password
 * PUT /api/auth/change-password
 */
export async function updatePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
  try {
    await apiClient.put('/api/auth/change-password', data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao alterar senha');
  }
}

/**
 * Enable 2FA
 * POST /api/settings/security/2fa/enable
 */
export async function enable2FA(): Promise<{ secret: string; qrCode: string }> {
  try {
    const response = await apiClient.post<{ secret: string; qrCode: string }>('/api/settings/security/2fa/enable');
    return response.data;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao habilitar 2FA');
  }
}

/**
 * Disable 2FA
 * POST /api/settings/security/2fa/disable
 */
export async function disable2FA(): Promise<void> {
  try {
    await apiClient.post('/api/settings/security/2fa/disable');
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao desabilitar 2FA');
  }
}

// =============================================
// API Keys (uses api-keys.service.ts for main operations)
// =============================================

/**
 * Get all API keys
 * GET /api/api-keys
 */
export async function getApiKeys(): Promise<ApiKey[]> {
  try {
    const response = await apiClient.get<any[]>(DASHBOARD_ENDPOINTS.API_KEYS);
    return response.data.map((key: any) => ({
      id: String(key.id),
      name: key.name,
      key: key.keyPrefix || key.key,
      type: key.type,
      permissions: key.permissions || ['read'],
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return [];
  }
}

/**
 * Create new API key
 * POST /api/api-keys
 */
export async function createApiKey(data: { name: string; type: 'public' | 'secret' }): Promise<ApiKey> {
  try {
    const response = await apiClient.post<any>(DASHBOARD_ENDPOINTS.API_KEYS, {
      name: data.name,
      type: data.type,
      permissions: data.type === 'public' ? ['read'] : ['read', 'write', 'delete'],
    });
    
    return {
      id: String(response.data.apiKey?.id || response.data.id),
      name: response.data.apiKey?.name || response.data.name,
      key: response.data.fullKey || response.data.key,
      type: response.data.apiKey?.type || response.data.type,
      permissions: response.data.apiKey?.permissions || response.data.permissions,
      createdAt: response.data.apiKey?.createdAt || response.data.createdAt,
    };
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao criar chave de API');
  }
}

/**
 * Delete API key
 * DELETE /api/api-keys/{id}
 */
export async function deleteApiKey(id: string): Promise<void> {
  try {
    await apiClient.delete(DASHBOARD_ENDPOINTS.API_KEY(id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao excluir chave de API');
  }
}

/**
 * Regenerate API key
 * POST /api/api-keys/{id}/regenerate
 */
export async function regenerateApiKey(id: string): Promise<ApiKey> {
  try {
    const response = await apiClient.post<any>(`${DASHBOARD_ENDPOINTS.API_KEY(id)}/regenerate`);
    return {
      id: String(response.data.id),
      name: response.data.name,
      key: response.data.fullKey || response.data.key,
      type: response.data.type,
      permissions: response.data.permissions,
      createdAt: response.data.createdAt,
    };
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao regenerar chave de API');
  }
}

// =============================================
// Team Management
// =============================================

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
    const response = await apiClient.get<TeamMemberResponse[]>(DASHBOARD_ENDPOINTS.TEAM);
    return response.data.map(mapTeamMember);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

/**
 * Invite team member
 * POST /api/settings/team/invite
 */
export async function inviteTeamMember(data: TeamInvite): Promise<TeamMember> {
  try {
    const response = await apiClient.post<TeamMemberResponse>(DASHBOARD_ENDPOINTS.TEAM_INVITE, data);
    return mapTeamMember(response.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao convidar membro');
  }
}

/**
 * Update team member role
 * PUT /api/settings/team/{id}
 */
export async function updateTeamMember(id: string, data: Partial<TeamMember>): Promise<TeamMember> {
  try {
    const response = await apiClient.put<TeamMemberResponse>(DASHBOARD_ENDPOINTS.TEAM_MEMBER(id), {
      role: data.role,
    });
    return mapTeamMember(response.data);
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao atualizar membro');
  }
}

/**
 * Remove team member
 * DELETE /api/settings/team/{id}
 */
export async function removeTeamMember(id: string): Promise<void> {
  try {
    await apiClient.delete(DASHBOARD_ENDPOINTS.TEAM_MEMBER(id));
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Erro ao remover membro');
  }
}

// Export service object for convenience
export const dashboardService = {
  getDashboardStats,
  getRecentActivity,
  getProjectSettings,
  updateProjectSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getSecuritySettings,
  updatePassword,
  enable2FA,
  disable2FA,
  getTeamMembers,
  inviteTeamMember,
  updateTeamMember,
  removeTeamMember,
  getApiKeys,
  createApiKey,
  deleteApiKey,
};
