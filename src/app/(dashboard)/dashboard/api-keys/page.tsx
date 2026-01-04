'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Key,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  X,
  Activity,
  Clock,
  Shield,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { Button, Card, CardContent, Input, Badge } from '@/components/ui';
import { apiKeysService } from '@/services/api-keys.service';
import { ApiKeyStats, ApiUsage } from '@/types';
import { toast } from '@/stores/toast.store';
import { cn } from '@/lib/utils';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyStats[]>([]);
  const [usage, setUsage] = useState<ApiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [newKeyFullValue, setNewKeyFullValue] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [keysData, usageData] = await Promise.all([
        apiKeysService.getApiKeys(),
        apiKeysService.getApiUsage(),
      ]);
      setApiKeys(keysData);
      setUsage(usageData);
    } catch (error) {
      toast.error('Erro ao carregar API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await apiKeysService.revokeApiKey(id);
      toast.success('API key revogada com sucesso');
      setRevokeConfirm(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao revogar API key');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const usagePercentage = usage
    ? Math.round((usage.requestsThisMonth / usage.monthlyLimit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chaves de API</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie suas chaves de API para acessar o conteúdo
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Gerar Nova Chave
        </Button>
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-green-100 dark:bg-brand-green-900/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-brand-green-600 dark:text-brand-green-400" />
                </div>
                <Badge variant="success" size="sm">Ativo</Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Requisições este mês
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(usage.requestsThisMonth)}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>{usagePercentage}% usado</span>
                  <span>{formatNumber(usage.monthlyLimit)} limite</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      usagePercentage > 90
                        ? 'bg-red-500'
                        : usagePercentage > 70
                        ? 'bg-yellow-500'
                        : 'bg-brand-green-500'
                    )}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Rate Limit
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(usage.rateLimit)}/min
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {formatNumber(usage.rateLimitRemaining)} restantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                API Keys Ativas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {apiKeys.filter((k) => k.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {apiKeys.filter((k) => k.status === 'revoked').length} revogadas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Keys List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma API key encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Crie sua primeira API key para começar a usar a API.
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Criar API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card
              key={apiKey.id}
              className={cn(
                'transition-all',
                apiKey.status === 'revoked' && 'opacity-60'
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        apiKey.type === 'secret'
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      )}
                    >
                      <Key
                        className={cn(
                          'w-5 h-5',
                          apiKey.type === 'secret'
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-blue-600 dark:text-blue-400'
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {apiKey.name}
                        </h3>
                        <Badge
                          variant={apiKey.status === 'active' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {apiKey.status === 'active' ? 'Ativa' : 'Revogada'}
                        </Badge>
                        <Badge variant="secondary" size="sm">
                          {apiKey.type === 'secret' ? 'Secret' : 'Public'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                          {apiKey.keyPrefix}
                        </code>
                        <button
                          onClick={() => handleCopy(apiKey.keyPrefix)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          <span>{formatNumber(apiKey.requestsThisMonth)} req/mês</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          <span>{formatNumber(apiKey.requestsToday)} hoje</span>
                        </div>
                        {apiKey.lastUsedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Último uso: {formatDate(apiKey.lastUsedAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Permissions */}
                      <div className="flex gap-2 mt-3">
                        {apiKey.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {apiKey.status === 'active' && (
                    <div className="flex items-center gap-2">
                      {revokeConfirm === apiKey.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Confirmar?
                          </span>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRevoke(apiKey.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevokeConfirm(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeConfirm(apiKey.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Revogar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateKeyModal
          onClose={() => {
            setShowCreateModal(false);
            setNewKeyFullValue(null);
          }}
          onCreated={(fullKey) => {
            setNewKeyFullValue(fullKey);
            fetchData();
          }}
          newKeyValue={newKeyFullValue}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}

// Create Key Modal Component
function CreateKeyModal({
  onClose,
  onCreated,
  newKeyValue,
  onCopy,
}: {
  onClose: () => void;
  onCreated: (fullKey: string) => void;
  newKeyValue: string | null;
  onCopy: (text: string) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'public' | 'secret'>('secret');
  const [permissions, setPermissions] = useState<string[]>(['read']);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setCreating(true);
      const { fullKey } = await apiKeysService.generateApiKey({
        name,
        type,
        permissions,
      });
      toast.success('API key criada com sucesso!');
      onCreated(fullKey);
    } catch (error) {
      toast.error('Erro ao criar API key');
    } finally {
      setCreating(false);
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  if (newKeyValue) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              API Key Criada!
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Copie sua API key agora. Você não poderá vê-la novamente.
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
                {newKeyValue}
              </code>
              <button
                onClick={() => onCopy(newKeyValue)}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-700 rounded-lg"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-6">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Por segurança, esta é a única vez que você verá a chave completa.
              Guarde-a em um local seguro.
            </p>
          </div>

          <Button variant="primary" className="w-full" onClick={onClose}>
            Entendi, fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Nova API Key
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Production Key, Development Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setType('secret')}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-colors',
                  type === 'secret'
                    ? 'border-brand-green-500 bg-brand-green-50 dark:bg-brand-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                <Shield className="w-5 h-5 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">Secret Key</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Acesso completo, use no servidor
                </p>
              </button>
              <button
                onClick={() => setType('public')}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-colors',
                  type === 'public'
                    ? 'border-brand-green-500 bg-brand-green-50 dark:bg-brand-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                <Key className="w-5 h-5 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">Public Key</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Apenas leitura, pode usar no frontend
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permissões
            </label>
            <div className="flex flex-wrap gap-2">
              {['read', 'write', 'delete'].map((perm) => (
                <button
                  key={perm}
                  onClick={() => togglePermission(perm)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    permissions.includes(perm)
                      ? 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-700 dark:text-brand-green-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {perm}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Gerando...' : 'Gerar API Key'}
          </Button>
        </div>
      </div>
    </div>
  );
}
