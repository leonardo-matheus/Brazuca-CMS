'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  User,
  Lock,
  Loader2,
  Save,
  CreditCard,
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from '@/stores/toast.store';

export interface CompanyData {
  id?: string;
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
  // Owner info (for new companies)
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
}

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CompanyData) => Promise<void>;
  company?: CompanyData | null;
  createWithOwner?: boolean;
}

const PLAN_OPTIONS = [
  {
    value: 'FREE',
    label: 'Free',
    description: '5 usuários, 3 workspaces, 1GB',
    price: 'Grátis',
  },
  {
    value: 'STARTER',
    label: 'Starter',
    description: '10 usuários, 10 workspaces, 5GB',
    price: 'R$ 99/mês',
  },
  {
    value: 'PROFESSIONAL',
    label: 'Professional',
    description: '50 usuários, 50 workspaces, 50GB',
    price: 'R$ 299/mês',
  },
  {
    value: 'ENTERPRISE',
    label: 'Enterprise',
    description: 'Usuários e workspaces ilimitados',
    price: 'Sob consulta',
  },
];

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

export function CompanyModal({
  isOpen,
  onClose,
  onSave,
  company,
  createWithOwner = true,
}: CompanyModalProps) {
  const [formData, setFormData] = useState<CompanyData>({
    name: '',
    description: '',
    cnpj: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    address: '',
    city: '',
    state: '',
    country: 'Brasil',
    zipCode: '',
    plan: 'STARTER',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'company' | 'owner'>('company');

  const isEditing = !!company?.id;

  useEffect(() => {
    if (company) {
      setFormData({
        ...company,
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        cnpj: '',
        contactEmail: '',
        contactPhone: '',
        websiteUrl: '',
        address: '',
        city: '',
        state: '',
        country: 'Brasil',
        zipCode: '',
        plan: 'STARTER',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
      });
    }
    setErrors({});
    setActiveTab('company');
  }, [company, isOpen]);

  // Format CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  // Format Phone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  // Format CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da empresa é obrigatório';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Email inválido';
    }

    if (formData.cnpj && formData.cnpj.replace(/\D/g, '').length !== 14) {
      newErrors.cnpj = 'CNPJ inválido';
    }

    // Validate owner data for new companies
    if (!isEditing && createWithOwner) {
      if (!formData.ownerName?.trim()) {
        newErrors.ownerName = 'Nome do proprietário é obrigatório';
      }
      if (!formData.ownerEmail?.trim()) {
        newErrors.ownerEmail = 'Email do proprietário é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
        newErrors.ownerEmail = 'Email inválido';
      }
      if (!formData.ownerPassword) {
        newErrors.ownerPassword = 'Senha é obrigatória';
      } else if (formData.ownerPassword.length < 6) {
        newErrors.ownerPassword = 'Senha deve ter no mínimo 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Switch to tab with errors
      if (errors.ownerName || errors.ownerEmail || errors.ownerPassword) {
        setActiveTab('owner');
      }
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      toast.success(isEditing ? 'Empresa atualizada com sucesso!' : 'Empresa criada com sucesso!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Empresa' : 'Nova Empresa'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs (only for new companies) */}
        {!isEditing && createWithOwner && (
          <div className="flex border-b dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab('company')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'company'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Dados da Empresa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('owner')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'owner'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Proprietário
            </button>
          </div>
        )}

        {/* Company Data Tab */}
        {(activeTab === 'company' || isEditing) && (
          <div className="space-y-4">
            {/* Name and CNPJ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Empresa *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da empresa"
                    className="pl-10"
                    error={errors.name}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CNPJ
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.cnpj || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })
                    }
                    placeholder="00.000.000/0001-00"
                    className="pl-10"
                    error={errors.cnpj}
                  />
                </div>
                {errors.cnpj && <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da empresa"
                rows={2}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email de Contato
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="contato@empresa.com"
                    className="pl-10"
                    error={errors.contactEmail}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.contactPhone || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPhone: formatPhone(e.target.value) })
                    }
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="url"
                    value={formData.websiteUrl || ''}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://empresa.com.br"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Endereço
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, complemento"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cidade
                </label>
                <Input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione</option>
                    {BRAZILIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CEP
                  </label>
                  <Input
                    type="text"
                    value={formData.zipCode || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: formatCEP(e.target.value) })
                    }
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Plano
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PLAN_OPTIONS.map((plan) => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, plan: plan.value as CompanyData['plan'] })
                    }
                    className={`p-3 border rounded-lg text-left transition-all ${
                      formData.plan === plan.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{plan.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                    <p className="text-sm font-semibold text-blue-600 mt-2">{plan.price}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Owner Data Tab */}
        {activeTab === 'owner' && !isEditing && createWithOwner && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                O proprietário será criado automaticamente com a role <strong>COMPANY_OWNER</strong>{' '}
                e terá acesso total à empresa.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Proprietário *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={formData.ownerName || ''}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="Nome completo"
                  className="pl-10"
                  error={errors.ownerName}
                />
              </div>
              {errors.ownerName && (
                <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email do Proprietário *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  value={formData.ownerEmail || ''}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  placeholder="email@empresa.com"
                  className="pl-10"
                  error={errors.ownerEmail}
                />
              </div>
              {errors.ownerEmail && (
                <p className="text-red-500 text-sm mt-1">{errors.ownerEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha Inicial *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  value={formData.ownerPassword || ''}
                  onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10"
                  error={errors.ownerPassword}
                />
              </div>
              {errors.ownerPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.ownerPassword}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Atualizar' : 'Criar Empresa'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
