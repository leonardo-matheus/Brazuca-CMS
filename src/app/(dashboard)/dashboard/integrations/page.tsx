'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Tabs } from '@/components/ui';
import { integrationsService, Integration, Platform, IntegrationStats } from '@/services/integrations.service';
import { 
  FiGithub, FiShoppingBag, FiMail, FiFileText, FiCreditCard, FiShield, 
  FiPlus, FiRefreshCw, FiSettings, FiTrash2, FiCheck, FiX, FiLink,
  FiZap, FiPackage, FiActivity, FiExternalLink, FiLock
} from 'react-icons/fi';

const platformIcons: Record<string, any> = {
  GITHUB: FiGithub,
  SHOPIFY: FiShoppingBag,
  WOOCOMMERCE: FiShoppingBag,
  KLAVIYO: FiMail,
  OPENAPI: FiFileText,
  STRIPE: FiCreditCard,
  AUTH0: FiLock,
  INSTAGRAM: FiPackage,
};

const categoryColors: Record<string, string> = {
  SAAS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ECOMMERCE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  SOCIAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  COMMUNICATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  PAYMENT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  AUTH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  DISABLED: 'bg-gray-100 text-gray-800',
  ERROR: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [connectForm, setConnectForm] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsData, platformsData, statsData] = await Promise.all([
        integrationsService.getIntegrations(),
        integrationsService.getAvailablePlatforms(),
        integrationsService.getStats(),
      ]);
      setIntegrations(integrationsData);
      setPlatforms(platformsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedPlatform) return;

    try {
      // For OAuth platforms, redirect to OAuth URL
      if (['GITHUB', 'SHOPIFY', 'AUTH0'].includes(selectedPlatform.id)) {
        const redirectUri = `${window.location.origin}/dashboard/integrations/callback`;
        let oauthUrl: string;

        switch (selectedPlatform.id) {
          case 'GITHUB':
            oauthUrl = await integrationsService.getGitHubOAuthUrl(redirectUri, selectedPlatform.id);
            break;
          case 'SHOPIFY':
            oauthUrl = await integrationsService.getShopifyOAuthUrl(
              connectForm.shopDomain,
              redirectUri,
              selectedPlatform.id
            );
            break;
          case 'AUTH0':
            oauthUrl = await integrationsService.getAuth0OAuthUrl(
              connectForm.domain,
              redirectUri,
              selectedPlatform.id
            );
            break;
          default:
            return;
        }

        window.location.href = oauthUrl;
        return;
      }

      // For API key platforms
      await integrationsService.connectIntegration({
        platform: selectedPlatform.id,
        name: connectForm.name || selectedPlatform.name,
        apiKey: connectForm.apiKey,
        apiSecret: connectForm.apiSecret,
        config: {
          specUrl: connectForm.specUrl,
          storeUrl: connectForm.storeUrl,
          consumerKey: connectForm.consumerKey,
          consumerSecret: connectForm.consumerSecret,
          domain: connectForm.domain,
          clientId: connectForm.clientId,
          clientSecret: connectForm.clientSecret,
        },
      });

      setConnectModalOpen(false);
      setSelectedPlatform(null);
      setConnectForm({});
      loadData();
    } catch (error) {
      console.error('Failed to connect integration:', error);
    }
  };

  const handleSync = async (integrationId: number) => {
    try {
      setSyncing(integrationId);
      await integrationsService.syncIntegration(integrationId);
      loadData();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (integrationId: number) => {
    if (!confirm('Tem certeza que deseja desconectar esta integração?')) return;

    try {
      await integrationsService.disconnectIntegration(integrationId);
      loadData();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const filteredIntegrations = activeTab === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === activeTab);

  const renderConnectForm = () => {
    if (!selectedPlatform) return null;

    switch (selectedPlatform.id) {
      case 'GITHUB':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Você será redirecionado para o GitHub para autorizar o acesso.
            </p>
          </div>
        );
      
      case 'SHOPIFY':
        return (
          <div className="space-y-4">
            <Input
              label="Domínio da Loja"
              placeholder="sua-loja.myshopify.com"
              value={connectForm.shopDomain || ''}
              onChange={(e) => setConnectForm({ ...connectForm, shopDomain: e.target.value })}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Você será redirecionado para autorizar o acesso.
            </p>
          </div>
        );
      
      case 'WOOCOMMERCE':
        return (
          <div className="space-y-4">
            <Input
              label="URL da Loja"
              placeholder="https://sua-loja.com"
              value={connectForm.storeUrl || ''}
              onChange={(e) => setConnectForm({ ...connectForm, storeUrl: e.target.value })}
            />
            <Input
              label="Consumer Key"
              placeholder="ck_..."
              value={connectForm.consumerKey || ''}
              onChange={(e) => setConnectForm({ ...connectForm, consumerKey: e.target.value })}
            />
            <Input
              label="Consumer Secret"
              placeholder="cs_..."
              type="password"
              value={connectForm.consumerSecret || ''}
              onChange={(e) => setConnectForm({ ...connectForm, consumerSecret: e.target.value })}
            />
          </div>
        );
      
      case 'KLAVIYO':
        return (
          <div className="space-y-4">
            <Input
              label="API Key"
              placeholder="pk_..."
              value={connectForm.apiKey || ''}
              onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })}
            />
          </div>
        );
      
      case 'STRIPE':
        return (
          <div className="space-y-4">
            <Input
              label="Secret Key"
              placeholder="sk_..."
              type="password"
              value={connectForm.apiKey || ''}
              onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use a chave secreta do seu dashboard Stripe.
            </p>
          </div>
        );
      
      case 'AUTH0':
        return (
          <div className="space-y-4">
            <Input
              label="Domínio Auth0"
              placeholder="seu-tenant.auth0.com"
              value={connectForm.domain || ''}
              onChange={(e) => setConnectForm({ ...connectForm, domain: e.target.value })}
            />
            <Input
              label="Client ID"
              value={connectForm.clientId || ''}
              onChange={(e) => setConnectForm({ ...connectForm, clientId: e.target.value })}
            />
            <Input
              label="Client Secret"
              type="password"
              value={connectForm.clientSecret || ''}
              onChange={(e) => setConnectForm({ ...connectForm, clientSecret: e.target.value })}
            />
          </div>
        );
      
      case 'OPENAPI':
        return (
          <div className="space-y-4">
            <Input
              label="Nome da API"
              placeholder="Minha API"
              value={connectForm.name || ''}
              onChange={(e) => setConnectForm({ ...connectForm, name: e.target.value })}
            />
            <Input
              label="URL do Spec (JSON)"
              placeholder="https://api.exemplo.com/openapi.json"
              value={connectForm.specUrl || ''}
              onChange={(e) => setConnectForm({ ...connectForm, specUrl: e.target.value })}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  const Icon = (platform: string) => platformIcons[platform] || FiLink;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrações</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Conecte plataformas e automatize fluxos de trabalho
          </p>
        </div>
        <Button onClick={() => setConnectModalOpen(true)}>
          <FiPlus className="mr-2" /> Nova Integração
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FiLink className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Integrações Ativas</p>
                <p className="text-2xl font-bold">{stats.activeIntegrations}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FiZap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Workflows Ativos</p>
                <p className="text-2xl font-bold">{stats.activeWorkflows}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <FiActivity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Execuções (30d)</p>
                <p className="text-2xl font-bold">{stats.totalExecutions30d}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <FiPackage className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Produtos Sincronizados</p>
                <p className="text-2xl font-bold">{stats.syncedProducts}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'SAAS', label: 'SaaS' },
            { id: 'ECOMMERCE', label: 'E-commerce' },
            { id: 'SOCIAL', label: 'Social' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Connected Integrations */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Integrações Conectadas</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredIntegrations.length === 0 ? (
          <Card className="p-12 text-center">
            <FiLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Nenhuma integração conectada ainda.</p>
            <Button onClick={() => setConnectModalOpen(true)} className="mt-4">
              Conectar Primeira Integração
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => {
              const IconComponent = Icon(integration.platform);
              return (
                <Card key={integration.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-gray-500">{integration.platform}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[integration.status]}>
                      {integration.status === 'ACTIVE' ? <FiCheck className="w-3 h-3 mr-1" /> : null}
                      {integration.status}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Último sync:</span>
                      <span>
                        {integration.lastSyncAt 
                          ? new Date(integration.lastSyncAt).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>Itens sincronizados:</span>
                      <span>{integration.totalItemsSynced}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(integration.id)}
                      disabled={syncing === integration.id}
                    >
                      <FiRefreshCw className={`w-4 h-4 mr-1 ${syncing === integration.id ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button variant="outline" size="sm">
                      <FiSettings className="w-4 h-4 mr-1" />
                      Configurar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Platforms */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Plataformas Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms
            .filter(p => !integrations.find(i => i.platform === p.id && i.status === 'ACTIVE'))
            .map((platform) => {
              const IconComponent = Icon(platform.id);
              return (
                <Card
                  key={platform.id}
                  className="p-4 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => {
                    setSelectedPlatform(platform);
                    setConnectModalOpen(true);
                  }}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium">{platform.name}</h3>
                      <Badge className={categoryColors[platform.category] + ' text-xs'}>
                        {platform.categoryName}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {platform.description}
                  </p>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Connect Modal */}
      <Modal
        isOpen={connectModalOpen}
        onClose={() => {
          setConnectModalOpen(false);
          setSelectedPlatform(null);
          setConnectForm({});
        }}
        title={selectedPlatform ? `Conectar ${selectedPlatform.name}` : 'Nova Integração'}
      >
        {!selectedPlatform ? (
          <div className="grid grid-cols-2 gap-4">
            {platforms.map((platform) => {
              const IconComponent = Icon(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform)}
                  className="p-4 border rounded-lg hover:border-blue-500 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <IconComponent className="w-6 h-6" />
                    <span className="ml-3 font-medium">{platform.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center">
              {(() => {
                const IconComponent = Icon(selectedPlatform.id);
                return <IconComponent className="w-8 h-8" />;
              })()}
              <div className="ml-4">
                <h3 className="font-semibold">{selectedPlatform.name}</h3>
                <p className="text-sm text-gray-500">{selectedPlatform.description}</p>
              </div>
            </div>
            
            {renderConnectForm()}
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPlatform(null);
                  setConnectForm({});
                }}
              >
                Voltar
              </Button>
              <Button onClick={handleConnect}>
                Conectar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
