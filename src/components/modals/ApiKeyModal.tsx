'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Globe,
  Lock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from '@/stores/toast.store';

export interface ApiKeyData {
  id?: string;
  name: string;
  type: 'public' | 'secret';
  permissions: string[];
  expiresAt?: string;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ApiKeyData) => Promise<{ key?: string; keyPrefix?: string }>;
  apiKey?: ApiKeyData | null;
}

const PERMISSION_OPTIONS = [
  {
    id: 'read:content',
    label: 'Ler Conteúdo',
    description: 'Acesso para leitura de entries e content types',
  },
  {
    id: 'write:content',
    label: 'Escrever Conteúdo',
    description: 'Criar e atualizar entries',
  },
  {
    id: 'delete:content',
    label: 'Deletar Conteúdo',
    description: 'Remover entries permanentemente',
  },
  {
    id: 'read:media',
    label: 'Ler Mídia',
    description: 'Acessar arquivos de mídia',
  },
  {
    id: 'write:media',
    label: 'Upload de Mídia',
    description: 'Fazer upload de novos arquivos',
  },
  {
    id: 'delete:media',
    label: 'Deletar Mídia',
    description: 'Remover arquivos de mídia',
  },
];

export function ApiKeyModal({
  isOpen,
  onClose,
  onSave,
  apiKey,
}: ApiKeyModalProps) {
  const [formData, setFormData] = useState<ApiKeyData>({
    name: '',
    type: 'public',
    permissions: ['read:content'],
    expiresAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const isEditing = !!apiKey?.id;

  useEffect(() => {
    if (apiKey) {
      setFormData({
        ...apiKey,
        expiresAt: apiKey.expiresAt || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'public',
        permissions: ['read:content'],
        expiresAt: '',
      });
    }
    setErrors({});
    setGeneratedKey(null);
    setShowKey(false);
    setKeyCopied(false);
  }, [apiKey, isOpen]);

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions };
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = 'Selecione pelo menos uma permissão';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await onSave(formData);

      if (result.key) {
        setGeneratedKey(result.key);
        toast.success('Chave de API criada com sucesso!');
      } else {
        toast.success('Chave de API atualizada!');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar chave de API');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    if (!generatedKey) return;

    try {
      await navigator.clipboard.writeText(generatedKey);
      setKeyCopied(true);
      toast.success('Chave copiada para a área de transferência!');
      setTimeout(() => setKeyCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar chave');
    }
  };

  const handleClose = () => {
    if (generatedKey) {
      // Confirm before closing if key hasn't been copied
      const confirmed = window.confirm(
        'Você copiou a chave? Ela não será exibida novamente após fechar este modal.'
      );
      if (!confirmed) return;
    }
    setGeneratedKey(null);
    onClose();
  };

  // Show generated key screen
  if (generatedKey) {
    return (
      <Modal open={isOpen} onClose={handleClose} title="Chave de API Criada">
        <div className="space-y-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Importante!
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Esta é a única vez que você verá esta chave completa. Copie e guarde em
                  local seguro.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sua Chave de API
            </label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={generatedKey}
                    readOnly
                    className="w-full pl-10 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border dark:border-gray-600 rounded-lg font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant={keyCopied ? 'primary' : 'outline'}
                  onClick={copyKey}
                  className="flex-shrink-0"
                >
                  {keyCopied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t dark:border-gray-700">
            <Button type="button" onClick={handleClose}>
              Entendi, fechar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Chave de API' : 'Nova Chave de API'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome da Chave *
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Website Production"
              className="pl-10"
              error={errors.name}
            />
          </div>
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Chave
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'public' })}
              className={`p-4 border rounded-lg text-left transition-all ${
                formData.type === 'public'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe
                  className={`w-5 h-5 ${
                    formData.type === 'public' ? 'text-blue-500' : 'text-gray-400'
                  }`}
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Pública</p>
                  <p className="text-sm text-gray-500">Pode ser usada no frontend</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'secret' })}
              className={`p-4 border rounded-lg text-left transition-all ${
                formData.type === 'secret'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock
                  className={`w-5 h-5 ${
                    formData.type === 'secret' ? 'text-purple-500' : 'text-gray-400'
                  }`}
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Secreta</p>
                  <p className="text-sm text-gray-500">Apenas backend/servidor</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Permissões *
          </label>
          {errors.permissions && (
            <p className="text-red-500 text-sm mb-2">{errors.permissions}</p>
          )}
          <div className="space-y-2 max-h-48 overflow-y-auto border dark:border-gray-700 rounded-lg p-2">
            {PERMISSION_OPTIONS.map((permission) => (
              <label
                key={permission.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  formData.permissions.includes(permission.id)
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(permission.id)}
                  onChange={() => togglePermission(permission.id)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {permission.label}
                  </p>
                  <p className="text-sm text-gray-500">{permission.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Expiração (opcional)
          </label>
          <Input
            type="datetime-local"
            value={formData.expiresAt || ''}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Deixe em branco para não expirar
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? 'Atualizando...' : 'Criando...'}
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                {isEditing ? 'Atualizar' : 'Criar Chave'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
