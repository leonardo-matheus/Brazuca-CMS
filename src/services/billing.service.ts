import { apiClient, ApiResponse } from '@/lib/api';

// ============ Types ============

export interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  maxProjects: number;
  maxUsers: number;
  maxApiRequests: number;
  maxStorageMb: number;
  maxWebhooks: number;
  hasGraphql: boolean;
  hasWebhooks: boolean;
  hasPrioritySupport: boolean;
  hasSso: boolean;
  hasCustomDomain: boolean;
  hasAdvancedAnalytics: boolean;
}

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAUSED';
  billingInterval: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  amount: number;
  currency: string;
  stripeSubscriptionId: string | null;
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'UNCOLLECTIBLE' | 'VOID';
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string | null;
  paidAt: string | null;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  createdAt: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PortalSession {
  url: string;
}

export interface CreateCheckoutRequest {
  planId: number;
  billingInterval: 'MONTHLY' | 'YEARLY';
  successUrl?: string;
  cancelUrl?: string;
}

// ============ API Endpoints ============

const ENDPOINTS = {
  PLANS: '/api/billing/plans',
  PLAN: (id: number) => `/api/billing/plans/${id}`,
  CHECKOUT: '/api/billing/checkout',
  PORTAL: '/api/billing/portal',
  SUBSCRIPTION: '/api/billing/subscription',
  CANCEL_SUBSCRIPTION: '/api/billing/subscription/cancel',
  REACTIVATE_SUBSCRIPTION: '/api/billing/subscription/reactivate',
  INVOICES: '/api/billing/invoices',
};

// ============ Service Functions ============

/**
 * Get all available subscription plans
 */
export async function getPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>(ENDPOINTS.PLANS);
  return response.data.data || [];
}

/**
 * Get a specific plan by ID
 */
export async function getPlan(id: number): Promise<SubscriptionPlan> {
  const response = await apiClient.get<ApiResponse<SubscriptionPlan>>(ENDPOINTS.PLAN(id));
  if (!response.data.data) throw new Error('Plan not found');
  return response.data.data;
}

/**
 * Get current subscription
 */
export async function getSubscription(): Promise<Subscription | null> {
  try {
    const response = await apiClient.get<ApiResponse<Subscription>>(ENDPOINTS.SUBSCRIPTION);
    return response.data.data || null;
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a checkout session for a new subscription
 */
export async function createCheckoutSession(data: CreateCheckoutRequest): Promise<CheckoutSession> {
  const response = await apiClient.post<ApiResponse<CheckoutSession>>(ENDPOINTS.CHECKOUT, data);
  if (!response.data.data) throw new Error('Failed to create checkout session');
  return response.data.data;
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(returnUrl?: string): Promise<PortalSession> {
  const url = returnUrl ? `${ENDPOINTS.PORTAL}?returnUrl=${encodeURIComponent(returnUrl)}` : ENDPOINTS.PORTAL;
  const response = await apiClient.post<ApiResponse<PortalSession>>(url);
  if (!response.data.data) throw new Error('Failed to create portal session');
  return response.data.data;
}

/**
 * Cancel the current subscription
 */
export async function cancelSubscription(immediate: boolean = false): Promise<Subscription> {
  const url = `${ENDPOINTS.CANCEL_SUBSCRIPTION}?immediate=${immediate}`;
  const response = await apiClient.post<ApiResponse<Subscription>>(url);
  if (!response.data.data) throw new Error('Failed to cancel subscription');
  return response.data.data;
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(): Promise<Subscription> {
  const response = await apiClient.post<ApiResponse<Subscription>>(ENDPOINTS.REACTIVATE_SUBSCRIPTION);
  if (!response.data.data) throw new Error('Failed to reactivate subscription');
  return response.data.data;
}

/**
 * Get all invoices
 */
export async function getInvoices(): Promise<Invoice[]> {
  const response = await apiClient.get<ApiResponse<Invoice[]>>(ENDPOINTS.INVOICES);
  return response.data.data || [];
}

// ============ Utility Functions ============

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Get status badge color
 */
export function getSubscriptionStatusColor(status: Subscription['status']): string {
  const colors: Record<Subscription['status'], string> = {
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    TRIALING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    PAST_DUE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    CANCELED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    UNPAID: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    INCOMPLETE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    INCOMPLETE_EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    PAUSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[status] || colors.ACTIVE;
}

/**
 * Get invoice status badge color
 */
export function getInvoiceStatusColor(status: Invoice['status']): string {
  const colors: Record<Invoice['status'], string> = {
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    UNCOLLECTIBLE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    VOID: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[status] || colors.DRAFT;
}

/**
 * Get human-readable status text
 */
export function getSubscriptionStatusText(status: Subscription['status']): string {
  const texts: Record<Subscription['status'], string> = {
    ACTIVE: 'Ativa',
    TRIALING: 'Período de teste',
    PAST_DUE: 'Pagamento atrasado',
    CANCELED: 'Cancelada',
    UNPAID: 'Não paga',
    INCOMPLETE: 'Incompleta',
    INCOMPLETE_EXPIRED: 'Expirada',
    PAUSED: 'Pausada',
  };
  return texts[status] || status;
}

export const billingService = {
  getPlans,
  getPlan,
  getSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  reactivateSubscription,
  getInvoices,
  formatCurrency,
  getSubscriptionStatusColor,
  getInvoiceStatusColor,
  getSubscriptionStatusText,
};
