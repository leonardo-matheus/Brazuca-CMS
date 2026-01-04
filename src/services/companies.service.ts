import { apiClient, getErrorMessage, ApiResponse } from '@/lib/api';

// =============================================
// Companies Service - Integração com Spring Boot
// Backend URL: http://localhost:8080
// =============================================

export interface CompanyResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  cnpj?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  logoUrl?: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  planValidUntil?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  maxUsers: number;
  maxWorkspaces: number;
  maxStorage: number;
  currentUsers: number;
  currentWorkspaces: number;
  currentStorage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
  cnpj?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  plan?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  // Optional owner creation
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  description?: string;
  cnpj?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface UpdatePlanRequest {
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  planValidUntil?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CompanyStats {
  totalUsers: number;
  maxUsers: number;
  totalWorkspaces: number;
  maxWorkspaces: number;
  storageUsed: number;
  maxStorage: number;
  plan: string;
}

// Transform backend response to frontend format
export function mapCompany(company: CompanyResponse) {
  return {
    id: String(company.id),
    name: company.name,
    slug: company.slug,
    description: company.description,
    cnpj: company.cnpj,
    contactEmail: company.contactEmail,
    contactPhone: company.contactPhone,
    websiteUrl: company.websiteUrl,
    address: company.address,
    city: company.city,
    state: company.state,
    country: company.country,
    zipCode: company.zipCode,
    logoUrl: company.logoUrl,
    plan: company.plan.toLowerCase() as 'free' | 'starter' | 'professional' | 'enterprise',
    planValidUntil: company.planValidUntil,
    status: company.status.toLowerCase() as 'active' | 'suspended' | 'inactive',
    maxUsers: company.maxUsers,
    maxWorkspaces: company.maxWorkspaces,
    maxStorage: company.maxStorage,
    currentUsers: company.currentUsers,
    currentWorkspaces: company.currentWorkspaces,
    currentStorage: company.currentStorage,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

/**
 * Get all companies (SUPER_ADMIN only)
 * GET /api/companies
 */
export async function getAllCompanies(params?: { page?: number; size?: number; search?: string }) {
  try {
    const response = await apiClient.get<ApiResponse<PageResponse<CompanyResponse>>>('/api/companies', {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
        search: params?.search,
      },
    });
    
    return {
      companies: response.data.data.content.map(mapCompany),
      total: response.data.data.totalElements,
      totalPages: response.data.data.totalPages,
      page: response.data.data.number,
    };
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

/**
 * Get company by ID
 * GET /api/companies/{id}
 */
export async function getCompanyById(id: string) {
  try {
    const response = await apiClient.get<ApiResponse<CompanyResponse>>(`/api/companies/${id}`);
    return mapCompany(response.data.data);
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}

/**
 * Get company by slug
 * GET /api/companies/slug/{slug}
 */
export async function getCompanyBySlug(slug: string) {
  try {
    const response = await apiClient.get<ApiResponse<CompanyResponse>>(`/api/companies/slug/${slug}`);
    return mapCompany(response.data.data);
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}

/**
 * Create new company (SUPER_ADMIN only)
 * POST /api/companies
 */
export async function createCompany(data: CreateCompanyRequest) {
  try {
    const response = await apiClient.post<ApiResponse<CompanyResponse>>('/api/companies', data);
    return mapCompany(response.data.data);
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

/**
 * Update company
 * PUT /api/companies/{id}
 */
export async function updateCompany(id: string, data: UpdateCompanyRequest) {
  try {
    const response = await apiClient.put<ApiResponse<CompanyResponse>>(`/api/companies/${id}`, data);
    return mapCompany(response.data.data);
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
}

/**
 * Update company plan
 * PUT /api/companies/{id}/plan
 */
export async function updateCompanyPlan(id: string, data: UpdatePlanRequest) {
  try {
    const response = await apiClient.put<ApiResponse<CompanyResponse>>(`/api/companies/${id}/plan`, data);
    return mapCompany(response.data.data);
  } catch (error) {
    console.error('Error updating company plan:', error);
    throw error;
  }
}

/**
 * Suspend company
 * POST /api/companies/{id}/suspend
 */
export async function suspendCompany(id: string) {
  try {
    const response = await apiClient.post<ApiResponse<CompanyResponse>>(`/api/companies/${id}/suspend`);
    return mapCompany(response.data.data);
  } catch (error) {
    console.error('Error suspending company:', error);
    throw error;
  }
}

/**
 * Activate company
 * POST /api/companies/{id}/activate
 */
export async function activateCompany(id: string) {
  try {
    const response = await apiClient.post<ApiResponse<CompanyResponse>>(`/api/companies/${id}/activate`);
    return mapCompany(response.data.data);
  } catch (error) {
    console.error('Error activating company:', error);
    throw error;
  }
}

/**
 * Delete company (SUPER_ADMIN only)
 * DELETE /api/companies/{id}
 */
export async function deleteCompany(id: string) {
  try {
    await apiClient.delete(`/api/companies/${id}`);
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
}

/**
 * Get company statistics
 * GET /api/companies/{id}/stats
 */
export async function getCompanyStats(id: string): Promise<CompanyStats> {
  try {
    const response = await apiClient.get<ApiResponse<CompanyStats>>(`/api/companies/${id}/stats`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching company stats:', error);
    throw error;
  }
}
