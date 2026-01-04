// =============================================
// Type Definitions for BrazucaCMS
// Backend: Spring Boot at http://localhost:8080
// =============================================

/**
 * User roles matching backend enum
 * Backend roles: SUPER_ADMIN, COMPANY_OWNER, ADMIN, USER
 */
export type UserRole = 'super_admin' | 'company_owner' | 'admin' | 'user';

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  company?: string;
  companyId?: string;
  active?: boolean;
  emailVerified?: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  password: string;
}

// Content Types
export interface ContentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  fields: ContentField[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentField {
  id: string;
  name: string;
  type: 'text' | 'richtext' | 'number' | 'boolean' | 'date' | 'media' | 'relation' | 'json';
  required: boolean;
  unique: boolean;
  defaultValue?: any;
  validation?: Record<string, any>;
}

export interface ContentEntry {
  id: string;
  contentTypeId: string;
  contentTypeName: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  data: Record<string, any>;
  author: Pick<User, 'id' | 'name' | 'avatar'>;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Media Types
export interface MediaFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
  folder?: string;
  uploadedBy: Pick<User, 'id' | 'name'>;
  createdAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  fileCount: number;
}

// API Types
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  type: 'public' | 'secret';
  permissions: string[];
  lastUsedAt?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Activity Types
export interface ActivityLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  entityType: 'content' | 'media' | 'user' | 'contentType';
  entityId: string;
  entityName: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Dashboard Types - matches Spring Boot DashboardStats DTO
export interface ContentTypeStats {
  id: number;
  name: string;
  slug: string;
  entriesCount: number;
}

export interface RecentActivity {
  type: string; // ENTRY_CREATED, ENTRY_UPDATED, ENTRY_PUBLISHED, MEDIA_UPLOADED
  title: string;
  description: string;
  userName: string;
  timestamp: string;
}

export interface DashboardStats {
  // Core counts from backend
  totalEntries: number;
  publishedEntries: number;
  draftEntries: number;
  totalContentTypes: number;
  totalMedia: number;
  totalApiKeys: number;
  totalUsers: number;
  
  // Detailed stats
  contentTypeStats: ContentTypeStats[];
  recentActivities: RecentActivity[];
  entriesByStatus: Record<string, number>;
  entriesByMonth: Record<string, number>;
  
  // Legacy fields for frontend compatibility (computed)
  entriesChange?: number;
  apiRequests?: number;
  apiRequestsChange?: number;
  storageUsed?: number;
  storageLimit?: number;
  teamMembers?: number;
  teamMembersChange?: number;
}

// Project/Settings Types
export interface Project {
  id: string;
  name: string;
  slug: string;
  url?: string;
  language: string;
  timezone: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
  newsletter: boolean;
}

// Team Types
export interface TeamMember extends User {
  invitedAt?: string;
  invitedBy?: string;
  status: 'active' | 'pending' | 'inactive';
}

export interface TeamInvite {
  email: string;
  role: UserRole;
  message?: string;
}

// Additional Types for Dashboard
export interface Activity {
  id: string;
  action: string;
  resource: string;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
  };
}

// Project Settings
export interface ProjectSettings {
  projectName: string;
  description?: string;
  defaultLocale: string;
  timezone: string;
  features?: string[];
}

// API Key Extended Types
export interface ApiKeyStats {
  id: string;
  name: string;
  keyPrefix: string;
  type: 'public' | 'secret';
  permissions: string[];
  requestsThisMonth: number;
  requestsToday: number;
  lastUsedAt?: string;
  createdAt: string;
  status: 'active' | 'revoked';
}

export interface ApiUsage {
  totalRequests: number;
  rateLimit: number;
  rateLimitRemaining: number;
  requestsThisMonth: number;
  monthlyLimit: number;
}

// Billing Types
export interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  planName: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  status: 'active' | 'canceled' | 'past_due';
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl: string;
}

// Integration Types
export interface Integration {
  id: string;
  name: string;
  type: 'webhook' | 'slack' | 'discord' | 'github';
  status: 'active' | 'inactive';
  config: Record<string, any>;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  status: 'active' | 'inactive';
  lastTriggeredAt?: string;
  createdAt: string;
}
