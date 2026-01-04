'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Building, Shield, Loader2 } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from '@/stores/toast.store';

export interface UserData {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'ADMIN' | 'USER';
  companyId?: string;
  active?: boolean;
}

interface Company {
  id: string;
  name: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserData) => Promise<void>;
  user?: UserData | null;
  currentUserRole: 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'ADMIN' | 'USER';
  companies?: Company[];
  currentCompanyId?: string;
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  COMPANY_OWNER: 'Dono da Empresa',
  ADMIN: 'Administrador',
  USER: 'Usuário',
};

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN: 'Acesso total ao sistema',
  COMPANY_OWNER: 'Gerencia empresa e usuários',
  ADMIN: 'Gerencia conteúdo e configurações',
  USER: 'Acesso básico ao conteúdo',
};

export function UserModal({
  isOpen,
  onClose,
  onSave,
  user,
  currentUserRole,
  companies = [],
  currentCompanyId,
}: UserModalProps) {
  const [formData, setFormData] = useState<UserData>({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    companyId: currentCompanyId || '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!user?.id;

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: '', // Don't pre-fill password
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        companyId: currentCompanyId || '',
        active: true,
      });
    }
    setErrors({});
  }, [user, currentCompanyId, isOpen]);

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (currentUserRole === 'SUPER_ADMIN') {
      return ['COMPANY_OWNER', 'ADMIN', 'USER'];
    }
    if (currentUserRole === 'COMPANY_OWNER') {
      return ['ADMIN', 'USER'];
    }
    return ['USER'];
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!isEditing && !formData.password) {
      newErrors.password = 'Senha é obrigatória para novos usuários';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (currentUserRole === 'SUPER_ADMIN' && !formData.companyId && formData.role !== 'SUPER_ADMIN') {
      newErrors.companyId = 'Empresa é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave(formData);
      toast.success(isEditing ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = getAvailableRoles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Usuário' : 'Novo Usuário'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do usuário"
              className="pl-10"
              error={errors.name}
            />
          </div>
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="pl-10"
              error={errors.email}
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
              className="pl-10"
              error={errors.password}
            />
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Company - Only for Super Admin */}
        {currentUserRole === 'SUPER_ADMIN' && companies.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Empresa
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.companyId || ''}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Selecione uma empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.companyId && <p className="text-red-500 text-sm mt-1">{errors.companyId}</p>}
          </div>
        )}

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Função
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserData['role'] })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {roleDescriptions[formData.role]}
          </p>
        </div>

        {/* Active Status */}
        {isEditing && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
              Usuário ativo
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : isEditing ? (
              'Atualizar'
            ) : (
              'Criar Usuário'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default UserModal;
