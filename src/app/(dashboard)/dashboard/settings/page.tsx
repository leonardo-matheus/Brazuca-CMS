'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  CreditCard,
  Link2,
  Save,
  Globe,
  Clock,
  Plus,
  Trash2,
  X,
  Check,
  Download,
  Zap,
  Bell,
  Send,
  RefreshCw,
  UserPlus,
  Crown,
  Edit,
  Eye,
} from 'lucide-react';
import { Button, Card, CardContent, Input, Badge, Avatar } from '@/components/ui';
import { settingsService } from '@/services/settings.service';
import {
  ProjectSettings,
  TeamMember,
  BillingInfo,
  Invoice,
  Webhook,
  Integration,
  UserRole,
} from '@/types';
import { toast } from '@/stores/toast.store';
import { cn } from '@/lib/utils';

type TabType = 'general' | 'members' | 'billing' | 'integrations';

// Role configuration with backend roles
const roleConfig: Record<UserRole, { label: string; icon: typeof Crown; color: string }> = {
  super_admin: { label: 'Super Admin', icon: Crown, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  company_owner: { label: 'Dono', icon: Crown, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  admin: { label: 'Admin', icon: Edit, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  user: { label: 'Usuário', icon: Eye, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState<ProjectSettings | null>(null);
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Billing State
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Integrations State
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [general, team, billing, invs, hooks, ints] = await Promise.all([
        settingsService.getGeneralSettings(),
        settingsService.getTeamMembers(),
        settingsService.getBillingInfo(),
        settingsService.getInvoices(),
        settingsService.getWebhooks(),
        settingsService.getIntegrations(),
      ]);
      setGeneralSettings(general);
      setTeamMembers(team);
      setBillingInfo(billing);
      setInvoices(invs);
      setWebhooks(hooks);
      setIntegrations(ints);
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: 'Geral', icon: Settings },
    { id: 'members' as TabType, label: 'Membros', icon: Users },
    { id: 'billing' as TabType, label: 'Faturamento', icon: CreditCard },
    { id: 'integrations' as TabType, label: 'Integrações', icon: Link2 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <Card className="animate-pulse">
          <CardContent className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Configure seu workspace e preferências
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-4 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-brand-green-500 text-brand-green-600 dark:text-brand-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <GeneralTab
          settings={generalSettings}
          onUpdate={setGeneralSettings}
          saving={savingGeneral}
          setSaving={setSavingGeneral}
        />
      )}
      {activeTab === 'members' && (
        <MembersTab
          members={teamMembers}
          onUpdate={setTeamMembers}
          showInviteModal={showInviteModal}
          setShowInviteModal={setShowInviteModal}
        />
      )}
      {activeTab === 'billing' && (
        <BillingTab billing={billingInfo} invoices={invoices} />
      )}
      {activeTab === 'integrations' && (
        <IntegrationsTab
          webhooks={webhooks}
          integrations={integrations}
          onUpdateWebhooks={setWebhooks}
          onUpdateIntegrations={setIntegrations}
          showWebhookModal={showWebhookModal}
          setShowWebhookModal={setShowWebhookModal}
        />
      )}
    </div>
  );
}

// ==================== General Tab ====================
function GeneralTab({
  settings,
  onUpdate,
  saving,
  setSaving,
}: {
  settings: ProjectSettings | null;
  onUpdate: (s: ProjectSettings) => void;
  saving: boolean;
  setSaving: (s: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    projectName: settings?.projectName || '',
    description: settings?.description || '',
    defaultLocale: settings?.defaultLocale || 'pt-BR',
    timezone: settings?.timezone || 'America/Sao_Paulo',
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await settingsService.updateGeneralSettings(formData);
      onUpdate(updated);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações do Workspace
            </h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Projeto
                </label>
                <Input
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Meu Projeto CMS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Uma breve descrição do projeto"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Localização
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Idioma Padrão
                </label>
                <select
                  value={formData.defaultLocale}
                  onChange={(e) => setFormData({ ...formData, defaultLocale: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Fuso Horário
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                >
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Members Tab ====================
function MembersTab({
  members,
  onUpdate,
  showInviteModal,
  setShowInviteModal,
}: {
  members: TeamMember[];
  onUpdate: (m: TeamMember[]) => void;
  showInviteModal: boolean;
  setShowInviteModal: (s: boolean) => void;
}) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    try {
      await settingsService.removeTeamMember(id);
      onUpdate(members.filter((m) => m.id !== id));
      toast.success('Membro removido');
      setRemovingId(null);
    } catch (error) {
      toast.error('Erro ao remover membro');
    }
  };

  const handleRoleChange = async (id: string, role: TeamMember['role']) => {
    try {
      const updated = await settingsService.updateMemberRole(id, role);
      onUpdate(members.map((m) => (m.id === id ? updated : m)));
      toast.success('Função atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar função');
    }
  };

  const handleInvite = async (email: string, role: TeamMember['role']) => {
    try {
      const newMember = await settingsService.inviteTeamMember({ email, role });
      onUpdate([...members, newMember]);
      toast.success('Convite enviado!');
      setShowInviteModal(false);
    } catch (error) {
      toast.error('Erro ao enviar convite');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {members.length} membros no workspace
        </p>
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Convidar Membro
        </Button>
      </div>

      <Card>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {members.map((member) => {
            const roleInfo = roleConfig[member.role];
            return (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar src={member.avatar} alt={member.name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </p>
                      {member.status === 'pending' && (
                        <Badge variant="warning" size="sm">Pendente</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as TeamMember['role'])}
                    disabled={member.role === 'super_admin' || member.role === 'company_owner'}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border-0',
                      roleInfo?.color || 'text-gray-600 bg-gray-100'
                    )}
                  >
                    <option value="company_owner">Dono</option>
                    <option value="admin">Admin</option>
                    <option value="user">Usuário</option>
                  </select>

                  {removingId === member.id ? (
                    <div className="flex items-center gap-1">
                      <Button variant="danger" size="sm" onClick={() => handleRemove(member.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setRemovingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemovingId(member.id)}
                      disabled={member.role === 'admin' && members.filter((m) => m.role === 'admin').length === 1}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onInvite={handleInvite} />
      )}
    </div>
  );
}

function InviteModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (email: string, role: TeamMember['role']) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMember['role']>('user');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Convidar Membro
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Função
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamMember['role'])}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
            >
              <option value="admin">Admin</option>
              <option value="user">Usuário</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => onInvite(email, role)}>
            <Send className="w-4 h-4 mr-2" />
            Enviar Convite
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== Billing Tab ====================
function BillingTab({
  billing,
  invoices,
}: {
  billing: BillingInfo | null;
  invoices: Invoice[];
}) {
  if (!billing) return null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Plano {billing.planName}
                </h3>
                <Badge variant="success" size="sm">Ativo</Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(billing.price, billing.currency)}
                <span className="text-sm font-normal text-gray-500">
                  /{billing.billingCycle === 'monthly' ? 'mês' : 'ano'}
                </span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Próxima cobrança em {formatDate(billing.nextBillingDate)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">Gerenciar Plano</Button>
              <Button variant="primary">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recursos do Plano
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Content Types', value: 'Ilimitado' },
              { label: 'Entries', value: 'Ilimitado' },
              { label: 'Armazenamento', value: '10 GB' },
              { label: 'Requisições API', value: '100k/mês' },
              { label: 'Membros da Equipe', value: '10' },
              { label: 'Suporte', value: 'Prioritário' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {feature.label}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Histórico de Faturas
          </h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(invoice.date)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {invoice.id}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                  <Badge
                    variant={invoice.status === 'paid' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Integrations Tab ====================
function IntegrationsTab({
  webhooks,
  integrations,
  onUpdateWebhooks,
  onUpdateIntegrations,
  showWebhookModal,
  setShowWebhookModal,
}: {
  webhooks: Webhook[];
  integrations: Integration[];
  onUpdateWebhooks: (w: Webhook[]) => void;
  onUpdateIntegrations: (i: Integration[]) => void;
  showWebhookModal: boolean;
  setShowWebhookModal: (s: boolean) => void;
}) {
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const handleTest = async (id: string) => {
    setTestingWebhook(id);
    try {
      const result = await settingsService.testWebhook(id);
      if (result.success) {
        toast.success(`Webhook testado com sucesso! Status: ${result.statusCode}`);
      } else {
        toast.error('Webhook retornou erro');
      }
    } catch (error) {
      toast.error('Erro ao testar webhook');
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await settingsService.deleteWebhook(id);
      onUpdateWebhooks(webhooks.filter((w) => w.id !== id));
      toast.success('Webhook removido');
    } catch (error) {
      toast.error('Erro ao remover webhook');
    }
  };

  const handleToggleIntegration = async (id: string) => {
    try {
      const updated = await settingsService.toggleIntegration(id);
      onUpdateIntegrations(integrations.map((i) => (i.id === id ? updated : i)));
      toast.success('Integração atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar integração');
    }
  };

  return (
    <div className="space-y-6">
      {/* Webhooks */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Webhooks
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receba notificações quando eventos ocorrerem
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowWebhookModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </div>

          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum webhook configurado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {webhook.name}
                        </p>
                        <Badge
                          variant={webhook.status === 'active' ? 'success' : 'secondary'}
                          size="sm"
                        >
                          {webhook.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <code className="text-sm text-gray-500 dark:text-gray-400 break-all">
                        {webhook.url}
                      </code>
                      <div className="flex gap-2 mt-2">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTest(webhook.id)}
                        disabled={testingWebhook === webhook.id}
                      >
                        {testingWebhook === webhook.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-1" />
                            Testar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Integrations */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Integrações
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {integration.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleIntegration(integration.id)}
                    className={cn(
                      'relative w-10 h-6 rounded-full transition-colors',
                      integration.status === 'active'
                        ? 'bg-brand-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                        integration.status === 'active' && 'translate-x-4'
                      )}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {integration.status === 'active' ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Modal */}
      {showWebhookModal && (
        <WebhookModal
          onClose={() => setShowWebhookModal(false)}
          onCreate={async (data) => {
            const newWebhook = await settingsService.createWebhook(data);
            onUpdateWebhooks([...webhooks, newWebhook]);
            toast.success('Webhook criado');
            setShowWebhookModal(false);
          }}
        />
      )}
    </div>
  );
}

function WebhookModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: Omit<Webhook, 'id' | 'createdAt' | 'lastTriggeredAt'>) => void;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['entry.created']);

  const availableEvents = [
    'entry.created',
    'entry.updated',
    'entry.deleted',
    'entry.published',
    'media.uploaded',
    'media.deleted',
  ];

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Novo Webhook
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Deploy Hook"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/webhook"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Eventos
            </label>
            <div className="flex flex-wrap gap-2">
              {availableEvents.map((event) => (
                <button
                  key={event}
                  onClick={() => toggleEvent(event)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    events.includes(event)
                      ? 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => onCreate({ name, url, events, status: 'active' })}
          >
            Criar Webhook
          </Button>
        </div>
      </div>
    </div>
  );
}
