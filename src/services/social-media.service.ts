import { apiClient, ApiResponse } from '@/lib/api';

// =============================================
// Social Media Service
// Integration with Instagram, Facebook, etc.
// =============================================

export interface SocialMediaAccount {
  id: number;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'LINKEDIN';
  accountUsername: string;
  platformAccountId: string;
  profilePictureUrl?: string;
  followersCount?: number;
  status: 'ACTIVE' | 'TOKEN_EXPIRED' | 'DISCONNECTED' | 'ERROR';
  tokenValid: boolean;
  tokenExpiresAt?: string;
  lastPostAt?: string;
  totalPosts: number;
  createdAt: string;
}

export interface SocialMediaPost {
  id: number;
  socialAccountId: number;
  platform: string;
  accountUsername: string;
  entryId?: number;
  entryTitle?: string;
  platformPostId?: string;
  status: 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'SCHEDULED' | 'FAILED' | 'DELETED';
  caption: string;
  mediaUrl: string;
  mediaType?: string;
  permalink?: string;
  errorMessage?: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface InstagramConnectRequest {
  code: string;
  redirectUri: string;
}

export interface InstagramPublishRequest {
  socialAccountId: number;
  caption: string;
  mediaUrl: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS';
  entryId?: number;
  scheduledAt?: string;
  additionalMediaUrls?: string[];
}

const SOCIAL_ENDPOINTS = {
  OAUTH_URL: '/api/social/instagram/oauth-url',
  CONNECT: '/api/social/instagram/connect',
  ACCOUNTS: '/api/social/accounts',
  INSTAGRAM_ACCOUNTS: '/api/social/instagram/accounts',
  DISCONNECT: '/api/social/accounts',
  PUBLISH: '/api/social/instagram/publish',
  REFRESH_TOKEN: '/api/social/accounts',
} as const;

/**
 * Get the Instagram OAuth URL to redirect user
 */
export async function getInstagramOAuthUrl(redirectUri: string): Promise<string> {
  const response = await apiClient.get<ApiResponse<{ url: string }>>(
    `${SOCIAL_ENDPOINTS.OAUTH_URL}?redirectUri=${encodeURIComponent(redirectUri)}`
  );
  return response.data.data?.url || '';
}

/**
 * Connect Instagram account after OAuth callback
 */
export async function connectInstagramAccount(
  request: InstagramConnectRequest
): Promise<SocialMediaAccount> {
  const response = await apiClient.post<ApiResponse<SocialMediaAccount>>(
    SOCIAL_ENDPOINTS.CONNECT,
    request
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to connect Instagram account');
  }
  return response.data.data;
}

/**
 * Get all connected social media accounts
 */
export async function getConnectedAccounts(): Promise<SocialMediaAccount[]> {
  const response = await apiClient.get<ApiResponse<SocialMediaAccount[]>>(
    SOCIAL_ENDPOINTS.ACCOUNTS
  );
  return response.data.data || [];
}

/**
 * Get connected Instagram accounts only
 */
export async function getInstagramAccounts(): Promise<SocialMediaAccount[]> {
  const response = await apiClient.get<ApiResponse<SocialMediaAccount[]>>(
    SOCIAL_ENDPOINTS.INSTAGRAM_ACCOUNTS
  );
  return response.data.data || [];
}

/**
 * Disconnect a social media account
 */
export async function disconnectAccount(accountId: number): Promise<void> {
  await apiClient.delete(`${SOCIAL_ENDPOINTS.DISCONNECT}/${accountId}`);
}

/**
 * Refresh account token
 */
export async function refreshAccountToken(accountId: number): Promise<void> {
  await apiClient.post(`${SOCIAL_ENDPOINTS.REFRESH_TOKEN}/${accountId}/refresh-token`);
}

/**
 * Publish to Instagram
 */
export async function publishToInstagram(
  request: InstagramPublishRequest
): Promise<SocialMediaPost> {
  const response = await apiClient.post<ApiResponse<SocialMediaPost>>(
    SOCIAL_ENDPOINTS.PUBLISH,
    request
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to publish to Instagram');
  }
  return response.data.data;
}

/**
 * Get platform display info
 */
export function getPlatformInfo(platform: string) {
  const platforms: Record<string, { name: string; color: string; icon: string }> = {
    INSTAGRAM: { name: 'Instagram', color: '#E4405F', icon: '📷' },
    FACEBOOK: { name: 'Facebook', color: '#1877F2', icon: '📘' },
    TWITTER: { name: 'Twitter/X', color: '#1DA1F2', icon: '🐦' },
    LINKEDIN: { name: 'LinkedIn', color: '#0A66C2', icon: '💼' },
  };
  return platforms[platform] || { name: platform, color: '#666', icon: '🔗' };
}
