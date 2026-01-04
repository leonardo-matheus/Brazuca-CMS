'use client';

import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Download, 
  ExternalLink, 
  Check, 
  AlertTriangle,
  RefreshCw,
  Crown,
  Zap,
  Building2,
  Calendar,
  Receipt
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { 
  billingService, 
  Subscription, 
  SubscriptionPlan, 
  Invoice,
  formatCurrency
} from '@/services/billing.service';
import { useToastStore } from '@/stores/toast.store';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [processingPlan, setProcessingPlan] = useState<number | null>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData, invoicesData] = await Promise.all([
        billingService.getPlans(),
        billingService.getSubscription(),
        billingService.getInvoices().catch(() => []),
      ]);
      setPlans(plansData);
      setSubscription(subscriptionData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading billing data:', error);
      addToast('Erro ao carregar dados de faturamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    try {
      setProcessingPlan(planId);
      const session = await billingService.createCheckoutSession({
        planId,
        billingInterval,
        successUrl: `${window.location.origin}/dashboard/settings?tab=billing&success=true`,
        cancelUrl: `${window.location.origin}/dashboard/settings?tab=billing&canceled=true`,
      });
      
      // Redirect to Stripe Checkout
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      addToast(error?.message || 'Erro ao iniciar checkout', 'error');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const portal = await billingService.createBillingPortalSession(
        `${window.location.origin}/dashboard/settings?tab=billing`
      );
      if (portal.url) {
        window.location.href = portal.url;
      }
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      addToast(error?.message || 'Erro ao abrir portal de faturamento', 'error');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Ela permanecerá ativa até o fim do período atual.')) {
      return;
    }

    try {
      const updatedSubscription = await billingService.cancelSubscription(false);
      setSubscription(updatedSubscription);
      addToast('Assinatura cancelada. Ela permanecerá ativa até o fim do período atual.', 'success');
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      addToast(error?.message || 'Erro ao cancelar assinatura', 'error');
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const updatedSubscription = await billingService.reactivateSubscription();
      setSubscription(updatedSubscription);
      addToast('Assinatura reativada com sucesso!', 'success');
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      addToast(error?.message || 'Erro ao reativar assinatura', 'error');
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter': return Zap;
      case 'pro': return Crown;
      case 'enterprise': return Building2;
      default: return Zap;
    }
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return subscription?.plan?.id === plan.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Faturamento</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">
          Gerencie sua assinatura e histórico de faturas
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-dark-900 dark:text-dark-50 mb-1">
                Assinatura Atual
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-dark-900 dark:text-dark-50">
                  {subscription.plan.displayName}
                </span>
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  billingService.getSubscriptionStatusColor(subscription.status)
                )}>
                  {billingService.getSubscriptionStatusText(subscription.status)}
                </span>
                {subscription.cancelAtPeriodEnd && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Cancela em {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              <div className="text-sm text-dark-500 dark:text-dark-400 space-y-1">
                <p>
                  {formatCurrency(subscription.amount, subscription.currency)} / {subscription.billingInterval === 'MONTHLY' ? 'mês' : 'ano'}
                </p>
                <p className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Próxima cobrança: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {subscription.cancelAtPeriodEnd ? (
                <Button variant="primary" onClick={handleReactivateSubscription}>
                  Reativar Assinatura
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleManageSubscription}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Gerenciar Pagamento
                  </Button>
                  <Button variant="ghost" onClick={handleCancelSubscription} className="text-red-600 hover:text-red-700">
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-dark-900 dark:text-dark-50">
            {subscription ? 'Mudar de Plano' : 'Escolha seu Plano'}
          </h2>
          
          {/* Billing Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-800 rounded-full p-1">
            <button
              onClick={() => setBillingInterval('MONTHLY')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                billingInterval === 'MONTHLY'
                  ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-dark-50 shadow-sm'
                  : 'text-dark-500 dark:text-dark-400'
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingInterval('YEARLY')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                billingInterval === 'YEARLY'
                  ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-dark-50 shadow-sm'
                  : 'text-dark-500 dark:text-dark-400'
              )}
            >
              Anual
              <span className="text-xs bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400 px-2 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.name);
            const price = billingInterval === 'YEARLY' ? plan.priceYearly / 12 : plan.priceMonthly;
            const isCurrent = isCurrentPlan(plan);
            const isPro = plan.name === 'pro';

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative p-6 transition-all',
                  isPro && 'ring-2 ring-brand-green-500 dark:ring-brand-green-400',
                  isCurrent && 'bg-brand-green-50 dark:bg-brand-green-900/10'
                )}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MAIS POPULAR
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-dark-900 dark:bg-dark-50 text-white dark:text-dark-900 text-xs font-bold px-3 py-1 rounded-full">
                      PLANO ATUAL
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isPro ? 'bg-brand-green-100 dark:bg-brand-green-900/30' : 'bg-gray-100 dark:bg-dark-800'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5',
                      isPro ? 'text-brand-green-600 dark:text-brand-green-400' : 'text-dark-500 dark:text-dark-400'
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900 dark:text-dark-50">{plan.displayName}</h3>
                    <p className="text-sm text-dark-500 dark:text-dark-400">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-dark-900 dark:text-dark-50">
                    {price === 0 ? 'Grátis' : formatCurrency(price, 'BRL')}
                  </span>
                  {price > 0 && (
                    <span className="text-dark-500 dark:text-dark-400 text-sm">/mês</span>
                  )}
                  {billingInterval === 'YEARLY' && price > 0 && (
                    <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                      {formatCurrency(plan.priceYearly, 'BRL')}/ano cobrado anualmente
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                    <Check className="w-4 h-4 text-brand-green-500" />
                    {plan.maxProjects === -1 ? 'Projetos ilimitados' : `${plan.maxProjects} projeto${plan.maxProjects > 1 ? 's' : ''}`}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                    <Check className="w-4 h-4 text-brand-green-500" />
                    {plan.maxUsers === -1 ? 'Usuários ilimitados' : `${plan.maxUsers} usuário${plan.maxUsers > 1 ? 's' : ''}`}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                    <Check className="w-4 h-4 text-brand-green-500" />
                    {plan.maxApiRequests === -1 ? 'Requisições ilimitadas' : `${(plan.maxApiRequests / 1000).toFixed(0)}k requisições/mês`}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                    <Check className="w-4 h-4 text-brand-green-500" />
                    {plan.maxStorageMb === -1 ? 'Armazenamento ilimitado' : `${plan.maxStorageMb >= 1024 ? `${(plan.maxStorageMb / 1024).toFixed(0)}GB` : `${plan.maxStorageMb}MB`} armazenamento`}
                  </li>
                  {plan.hasGraphql && (
                    <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                      <Check className="w-4 h-4 text-brand-green-500" />
                      API GraphQL
                    </li>
                  )}
                  {plan.hasPrioritySupport && (
                    <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                      <Check className="w-4 h-4 text-brand-green-500" />
                      Suporte prioritário
                    </li>
                  )}
                  {plan.hasSso && (
                    <li className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                      <Check className="w-4 h-4 text-brand-green-500" />
                      SSO / SAML
                    </li>
                  )}
                </ul>

                <Button
                  variant={isPro ? 'primary' : 'outline'}
                  className="w-full"
                  disabled={isCurrent || processingPlan === plan.id || price === 0 && isCurrent}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {processingPlan === plan.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    'Plano Atual'
                  ) : price === 0 ? (
                    'Plano Gratuito'
                  ) : subscription ? (
                    'Mudar para este plano'
                  ) : (
                    'Assinar'
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invoices Section */}
      {invoices.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-dark-900 dark:text-dark-50 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Histórico de Faturas
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-dark-500 dark:text-dark-400 border-b border-gray-200 dark:border-dark-700">
                  <th className="pb-3 font-medium">Fatura</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Valor</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="text-sm">
                    <td className="py-4 text-dark-900 dark:text-dark-50 font-medium">
                      {invoice.invoiceNumber || `#${invoice.id}`}
                    </td>
                    <td className="py-4 text-dark-500 dark:text-dark-400">
                      {new Date(invoice.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 text-dark-900 dark:text-dark-50">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        billingService.getInvoiceStatusColor(invoice.status)
                      )}>
                        {invoice.status === 'PAID' ? 'Paga' : invoice.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.invoicePdf && (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4 text-dark-500 dark:text-dark-400" />
                          </a>
                        )}
                        {invoice.hostedInvoiceUrl && (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                            title="Ver no Stripe"
                          >
                            <ExternalLink className="w-4 h-4 text-dark-500 dark:text-dark-400" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* No Invoices */}
      {invoices.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Receipt className="w-12 h-12 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
          <p className="text-dark-500 dark:text-dark-400">
            Nenhuma fatura encontrada
          </p>
        </Card>
      )}
    </div>
  );
}
