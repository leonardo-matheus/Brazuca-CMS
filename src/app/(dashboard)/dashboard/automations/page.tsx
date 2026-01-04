'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Tabs } from '@/components/ui';
import { integrationsService, Workflow, Integration, WorkflowCreateRequest } from '@/services/integrations.service';
import { 
  FiZap, FiPlus, FiPlay, FiPause, FiTrash2, FiSettings, FiClock,
  FiCheck, FiX, FiActivity, FiGitBranch, FiArrowRight
} from 'react-icons/fi';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
};

const triggerTypes = [
  { id: 'WEBHOOK', name: 'Webhook', description: 'Disparado por evento externo' },
  { id: 'SCHEDULE', name: 'Agendado', description: 'Executa em horários definidos' },
  { id: 'MANUAL', name: 'Manual', description: 'Disparado manualmente' },
  { id: 'INTEGRATION', name: 'Integração', description: 'Quando uma integração dispara evento' },
  { id: 'CMS_EVENT', name: 'Evento CMS', description: 'Quando conteúdo é criado/atualizado' },
];

const actionTypes = [
  { id: 'GITHUB_SYNC_FILE', name: 'GitHub: Sincronizar Arquivo', platform: 'GITHUB' },
  { id: 'SHOPIFY_SYNC_PRODUCTS', name: 'Shopify: Sincronizar Produtos', platform: 'SHOPIFY' },
  { id: 'KLAVIYO_ADD_TO_LIST', name: 'Klaviyo: Adicionar à Lista', platform: 'KLAVIYO' },
  { id: 'KLAVIYO_TRACK_EVENT', name: 'Klaviyo: Rastrear Evento', platform: 'KLAVIYO' },
  { id: 'OPENAPI_SYNC_DOCS', name: 'OpenAPI: Sincronizar Docs', platform: 'OPENAPI' },
  { id: 'CMS_CREATE_ENTRY', name: 'CMS: Criar Entrada', platform: 'CMS' },
  { id: 'CMS_UPDATE_ENTRY', name: 'CMS: Atualizar Entrada', platform: 'CMS' },
  { id: 'CMS_PUBLISH_ENTRY', name: 'CMS: Publicar Entrada', platform: 'CMS' },
  { id: 'HTTP_REQUEST', name: 'HTTP: Requisição Customizada', platform: 'HTTP' },
  { id: 'DELAY', name: 'Delay: Aguardar', platform: 'SYSTEM' },
  { id: 'LOG', name: 'Log: Registrar', platform: 'SYSTEM' },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [executing, setExecuting] = useState<number | null>(null);

  // Form state
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState<Partial<WorkflowCreateRequest>>({
    name: '',
    description: '',
    trigger: { type: 'MANUAL' },
    actions: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workflowsData, integrationsData] = await Promise.all([
        integrationsService.getWorkflows(),
        integrationsService.getIntegrations(),
      ]);
      setWorkflows(workflowsData);
      setIntegrations(integrationsData.filter(i => i.status === 'ACTIVE'));
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await integrationsService.createWorkflow(formData as WorkflowCreateRequest);
      setModalOpen(false);
      setFormData({ name: '', description: '', trigger: { type: 'MANUAL' }, actions: [] });
      setFormStep(1);
      loadData();
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await integrationsService.activateWorkflow(id);
      loadData();
    } catch (error) {
      console.error('Failed to activate:', error);
    }
  };

  const handlePause = async (id: number) => {
    try {
      await integrationsService.pauseWorkflow(id);
      loadData();
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  };

  const handleExecute = async (id: number) => {
    try {
      setExecuting(id);
      await integrationsService.executeWorkflow(id);
      loadData();
    } catch (error) {
      console.error('Failed to execute:', error);
    } finally {
      setExecuting(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este workflow?')) return;

    try {
      await integrationsService.deleteWorkflow(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...(formData.actions || []),
        { type: 'LOG', config: {} },
      ],
    });
  };

  const removeAction = (index: number) => {
    const actions = [...(formData.actions || [])];
    actions.splice(index, 1);
    setFormData({ ...formData, actions });
  };

  const updateAction = (index: number, data: any) => {
    const actions = [...(formData.actions || [])];
    actions[index] = { ...actions[index], ...data };
    setFormData({ ...formData, actions });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automações</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crie workflows para automatizar tarefas entre integrações
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <FiPlus className="mr-2" /> Novo Workflow
        </Button>
      </div>

      {/* Workflows Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <FiZap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum workflow criado</h3>
          <p className="text-gray-500 mb-4">
            Crie seu primeiro workflow para automatizar tarefas entre suas integrações.
          </p>
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="mr-2" /> Criar Workflow
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <FiZap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">{workflow.name}</h3>
                    <p className="text-sm text-gray-500">{workflow.triggerType}</p>
                  </div>
                </div>
                <Badge className={statusColors[workflow.status]}>
                  {workflow.status}
                </Badge>
              </div>

              {workflow.description && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {workflow.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-semibold">{workflow.totalRuns}</p>
                  </div>
                  <div>
                    <p className="text-green-500">Sucesso</p>
                    <p className="font-semibold text-green-600">{workflow.successfulRuns}</p>
                  </div>
                  <div>
                    <p className="text-red-500">Falhas</p>
                    <p className="font-semibold text-red-600">{workflow.failedRuns}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {workflow.status === 'DRAFT' || workflow.status === 'PAUSED' ? (
                  <Button size="sm" onClick={() => handleActivate(workflow.id)}>
                    <FiPlay className="w-4 h-4 mr-1" /> Ativar
                  </Button>
                ) : workflow.status === 'ACTIVE' ? (
                  <Button size="sm" variant="outline" onClick={() => handlePause(workflow.id)}>
                    <FiPause className="w-4 h-4 mr-1" /> Pausar
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExecute(workflow.id)}
                  disabled={executing === workflow.id}
                >
                  {executing === workflow.id ? (
                    <FiActivity className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <FiPlay className="w-4 h-4 mr-1" />
                  )}
                  Executar
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(workflow.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <FiTrash2 className="w-4 h-4" />
                </Button>
              </div>

              {workflow.lastRunAt && (
                <p className="mt-3 text-xs text-gray-400 flex items-center">
                  <FiClock className="w-3 h-3 mr-1" />
                  Última execução: {new Date(workflow.lastRunAt).toLocaleString('pt-BR')}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormStep(1);
          setFormData({ name: '', description: '', trigger: { type: 'MANUAL' }, actions: [] });
        }}
        title="Criar Workflow"
        size="lg"
      >
        <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    formStep >= step
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-20 h-1 mx-2 ${
                      formStep > step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {formStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Informações Básicas</h3>
              <Input
                label="Nome do Workflow"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Sync produtos para CMS"
              />
              <Input
                label="Descrição (opcional)"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que este workflow faz"
              />
            </div>
          )}

          {/* Step 2: Trigger */}
          {formStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Gatilho</h3>
              <p className="text-sm text-gray-500">O que irá disparar este workflow?</p>
              
              <div className="grid grid-cols-1 gap-3">
                {triggerTypes.map((trigger) => (
                  <button
                    key={trigger.id}
                    onClick={() => setFormData({
                      ...formData,
                      trigger: { ...formData.trigger, type: trigger.id }
                    })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      formData.trigger?.type === trigger.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium">{trigger.name}</h4>
                    <p className="text-sm text-gray-500">{trigger.description}</p>
                  </button>
                ))}
              </div>

              {formData.trigger?.type === 'INTEGRATION' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Integração de Origem
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={formData.trigger.integrationId || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger: { ...formData.trigger!, type: formData.trigger!.type, integrationId: parseInt(e.target.value) }
                    })}
                  >
                    <option value="">Selecione...</option>
                    {integrations.map((int) => (
                      <option key={int.id} value={int.id}>
                        {int.name} ({int.platform})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.trigger?.type === 'CMS_EVENT' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Evento do CMS
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    value={formData.trigger.event || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger: { ...formData.trigger!, type: formData.trigger!.type, event: e.target.value }
                    })}
                  >
                    <option value="">Selecione...</option>
                    <option value="entry.created">Entrada Criada</option>
                    <option value="entry.updated">Entrada Atualizada</option>
                    <option value="entry.published">Entrada Publicada</option>
                    <option value="entry.deleted">Entrada Excluída</option>
                    <option value="media.uploaded">Mídia Enviada</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Actions */}
          {formStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Ações</h3>
                  <p className="text-sm text-gray-500">O que acontece quando o workflow executa?</p>
                </div>
                <Button size="sm" onClick={addAction}>
                  <FiPlus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>

              {formData.actions?.length === 0 && (
                <Card className="p-6 text-center border-dashed">
                  <FiGitBranch className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Nenhuma ação adicionada</p>
                  <Button size="sm" onClick={addAction} className="mt-2">
                    Adicionar Primeira Ação
                  </Button>
                </Card>
              )}

              <div className="space-y-3">
                {formData.actions?.map((action, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        {index > 0 && (
                          <FiArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                        )}
                      </div>
                      <button
                        onClick={() => removeAction(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>

                    <select
                      className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 mb-3"
                      value={action.type}
                      onChange={(e) => updateAction(index, { type: e.target.value })}
                    >
                      {actionTypes.map((at) => (
                        <option key={at.id} value={at.id}>
                          {at.name}
                        </option>
                      ))}
                    </select>

                    {action.type.includes('SHOPIFY') || action.type.includes('KLAVIYO') || action.type.includes('GITHUB') ? (
                      <select
                        className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        value={action.integrationId || ''}
                        onChange={(e) => updateAction(index, { integrationId: parseInt(e.target.value) })}
                      >
                        <option value="">Selecione a integração...</option>
                        {integrations
                          .filter((int) => actionTypes.find(at => at.id === action.type)?.platform === int.platform)
                          .map((int) => (
                            <option key={int.id} value={int.id}>
                              {int.name}
                            </option>
                          ))}
                      </select>
                    ) : null}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setFormStep(Math.max(1, formStep - 1))}
              disabled={formStep === 1}
            >
              Voltar
            </Button>
            
            {formStep < 3 ? (
              <Button
                onClick={() => setFormStep(formStep + 1)}
                disabled={formStep === 1 && !formData.name}
              >
                Próximo
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={!formData.actions?.length}>
                Criar Workflow
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
