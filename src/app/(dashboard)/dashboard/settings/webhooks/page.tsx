'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Webhook,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  Link,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import { Button, Card, CardContent, Input, Badge, Modal } from '@/components/ui';
import { 
  webhooksService, 
  Webhook as WebhookType, 
  CreateWebhookData, 
  WebhookLog,
  WEBHOOK_EVENTS 
} from '@/services/webhooks.service';
import { toast } from '@/stores/toast.store';
import { cn } from '@/lib/utils';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  
  // Logs viewer
  const [logsModal, setLogsModal] = useState<{ webhookId: string; name: string } | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateWebhookData>({
    name: '',
    url: '',
    events: [],
    secret: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const data = await webhooksService.getWebhooks();
      setWebhooks(data);
    } catch (error) {
      toast.error('Erro ao carregar webhooks');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for new/edit
  const handleOpenModal = (webhook?: WebhookType) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret || '',
        active: webhook.active,
      });
    } else {
      setEditingWebhook(null);
      setFormData({
        name: '',
        url: '',
        events: [],
        secret: '',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  // Save webhook
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formData.url.trim()) {
      toast.error('URL é obrigatória');
      return;
    }
    if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
      toast.error('URL deve começar com http:// ou https://');
      return;
    }
    if (formData.events.length === 0) {
      toast.error('Selecione pelo menos um evento');
      return;
    }

    setSaving(true);
    try {
      if (editingWebhook) {
        await webhooksService.updateWebhook(editingWebhook.id, formData);
        toast.success('Webhook atualizado');
      } else {
        await webhooksService.createWebhook(formData);
        toast.success('Webhook criado');
      }
      setIsModalOpen(false);
      fetchWebhooks();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar webhook');
    } finally {
      setSaving(false);
    }
  };

  // Delete webhook
  const handleDelete = async (webhookId: string) => {
    try {
      await webhooksService.deleteWebhook(webhookId);
      toast.success('Webhook excluído');
      setDeleteConfirm(null);
      fetchWebhooks();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir webhook');
    }
  };

  // Test webhook
  const handleTest = async (webhookId: string) => {
    setTestingWebhook(webhookId);
    try {
      const result = await webhooksService.testWebhook(webhookId);
      if (result.success) {
        toast.success(`Teste enviado! Status: ${result.statusCode}`);
      } else {
        toast.error(`Falha no teste: ${result.message}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao testar webhook');
    } finally {
      setTestingWebhook(null);
    }
  };

  // View logs
  const handleViewLogs = async (webhook: WebhookType) => {
    setLogsModal({ webhookId: webhook.id, name: webhook.name });
    setLoadingLogs(true);
    try {
      const data = await webhooksService.getWebhookLogs(webhook.id);
      setLogs(data);
    } catch (error) {
      toast.error('Erro ao carregar logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Toggle event selection
  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  // Select all events
  const selectAllEvents = () => {
    setFormData(prev => ({
      ...prev,
      events: WEBHOOK_EVENTS.map(e => e.value)
    }));
  };

  // Clear all events
  const clearAllEvents = () => {
    setFormData(prev => ({ ...prev, events: [] }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Group events by category
  const eventsByCategory = WEBHOOK_EVENTS.reduce((acc, event) => {
    const category = event.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {} as Record<string, Array<typeof WEBHOOK_EVENTS[number]>>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure webhooks para integrar com sistemas externos
          </p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Novo Webhook
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Como funcionam os webhooks?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Webhooks enviam notificações HTTP automaticamente quando eventos ocorrem no seu CMS.
                Você pode usar para sincronizar com outros sistemas, disparar builds, enviar notificações, etc.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Webhook className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum webhook configurado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Configure webhooks para integrar seu CMS com outros sistemas.
            </p>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <Plus className="w-5 h-5 mr-2" />
              Criar Primeiro Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      webhook.active 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      <Webhook className={cn(
                        'w-5 h-5',
                        webhook.active 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {webhook.name}
                        </h3>
                        <Badge variant={webhook.active ? 'success' : 'secondary'}>
                          {webhook.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                        <Link className="w-3 h-3 inline-block mr-1" />
                        {webhook.url}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 3).map((event) => (
                          <span
                            key={event}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          >
                            {event}
                          </span>
                        ))}
                        {webhook.events.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{webhook.events.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook.id)}
                      disabled={testingWebhook === webhook.id}
                    >
                      {testingWebhook === webhook.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewLogs(webhook)}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(webhook)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {deleteConfirm === webhook.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(webhook.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(webhook.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Last delivery info */}
                {webhook.lastDelivery && (
                  <div className="mt-3 pt-3 border-t dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      {webhook.lastDelivery.success ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-500" />
                      )}
                      Último envio: {webhook.lastDelivery.success ? 'Sucesso' : 'Falha'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(webhook.lastDelivery.timestamp)}
                    </span>
                    {webhook.lastDelivery.statusCode && (
                      <span>Status: {webhook.lastDelivery.statusCode}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Notificação Slack"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL do Webhook *
            </label>
            <Input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://api.exemplo.com/webhook"
            />
          </div>

          {/* Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secret (opcional)
            </label>
            <Input
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
              placeholder="Chave secreta para validação"
            />
            <p className="text-xs text-gray-500 mt-1">
              Será enviado no header X-Webhook-Secret para validação
            </p>
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Eventos *
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllEvents}
                  className="text-xs text-brand-green-600 hover:text-brand-green-700"
                >
                  Selecionar todos
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearAllEvents}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpar
                </button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-64 overflow-y-auto border dark:border-gray-700 rounded-lg p-4">
              {Object.entries(eventsByCategory).map(([category, events]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {events.map((event) => (
                      <label key={event.value} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.events.includes(event.value)}
                          onChange={() => toggleEvent(event.value)}
                          className="mt-0.5 rounded border-gray-300 text-brand-green-500 focus:ring-brand-green-500"
                        />
                        <div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {event.value}
                          </span>
                          <p className="text-xs text-gray-500">{event.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded border-gray-300 text-brand-green-500 focus:ring-brand-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Webhook ativo
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingWebhook ? 'Salvar Alterações' : 'Criar Webhook'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logs Modal */}
      {logsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Logs de Entrega
                </h2>
                <p className="text-sm text-gray-500">{logsModal.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLogsModal(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log de entrega encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        'p-4 border rounded-lg',
                        log.success 
                          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                          : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {log.event}
                          </span>
                          {log.statusCode && (
                            <Badge variant={log.success ? 'success' : 'danger'}>
                              {log.statusCode}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      
                      {log.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                          Erro: {log.error}
                        </p>
                      )}
                      
                      {log.duration && (
                        <p className="text-xs text-gray-500 mt-1">
                          Duração: {log.duration}ms
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
