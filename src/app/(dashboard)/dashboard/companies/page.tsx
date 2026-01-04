'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  CreditCard,
  Calendar,
  FileText,
  Eye,
  Pause,
  Play,
} from 'lucide-react';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { ConfirmModal } from '@/components/ui/Modal';
import { CompanyModal, CompanyData } from '@/components/modals';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import * as companiesService from '@/services/companies.service';

interface Company {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  cnpj?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'inactive';
  currentUsers: number;
  maxUsers: number;
  currentWorkspaces?: number;
  currentStorage?: number;
  createdAt: string;
}

// Plan configuration
const planConfig: Record<string, { label: string; color: string }> = {
  free: { label: 'Gratuito', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
  starter: { label: 'Starter', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  professional: { label: 'Pro', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  enterprise: { label: 'Enterprise', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
};

export default function CompaniesPage() {
  const { user: currentUser } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);

  // Modal states
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);

  const currentUserRole = currentUser?.role?.toUpperCase().replace('-', '_');
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await companiesService.getAllCompanies({
        page,
        size: 20,
        search: searchTerm || undefined,
      });

      setCompanies(result.companies as unknown as Company[]);
      setTotalPages(result.totalPages);
      setTotalCompanies(result.total);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
    }
  }, [fetchCompanies, isSuperAdmin]);

  // Handle create/edit company
  const handleSaveCompany = async (data: CompanyData) => {
    if (data.id) {
      // Update company
      await companiesService.updateCompany(data.id, {
        name: data.name,
        description: data.description,
        cnpj: data.cnpj,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        websiteUrl: data.websiteUrl,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
      });
      
      // Update plan if changed
      if (data.plan) {
        await companiesService.updateCompanyPlan(data.id, { plan: data.plan });
      }
    } else {
      // Create company with optional owner
      await companiesService.createCompany({
        name: data.name,
        description: data.description,
        cnpj: data.cnpj,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        websiteUrl: data.websiteUrl,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        plan: data.plan,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPassword: data.ownerPassword,
      });
    }
    fetchCompanies();
  };

  // Handle delete company
  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    setActionLoading(true);
    try {
      await companiesService.deleteCompany(companyToDelete.id);
      toast.success('Empresa removida com sucesso');
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover empresa');
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (company: Company) => {
    try {
      if (company.status === 'active') {
        await companiesService.suspendCompany(company.id);
        toast.success('Empresa suspensa com sucesso');
      } else {
        await companiesService.activateCompany(company.id);
        toast.success('Empresa ativada com sucesso');
      }
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar status');
    }
  };

  // Open edit modal
  const openEditModal = (company: Company) => {
    setSelectedCompany({
      id: company.id,
      name: company.name,
      description: company.description,
      cnpj: company.cnpj,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      websiteUrl: company.websiteUrl,
      address: company.address,
      city: company.city,
      state: company.state,
      plan: company.plan.toUpperCase() as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
    });
    setCompanyModalOpen(true);
  };

  // Open create modal
  const openCreateModal = () => {
    setSelectedCompany(null);
    setCompanyModalOpen(true);
  };

  // Get plan badge
  const getPlanBadge = (plan: string) => {
    const config = planConfig[plan] || planConfig.FREE;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <CreditCard className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  // Format storage
  const formatStorage = (bytes?: number) => {
    if (!bytes) return '0 MB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-500">
              Apenas Super Administradores podem gerenciar empresas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Building2 className="w-7 h-7" />
            Gerenciar Empresas
          </h1>
          <p className="text-gray-500 mt-1">
            {totalCompanies} {totalCompanies === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}
          </p>
        </div>

        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(planConfig).map(([plan, config]) => {
          const count = companies.filter(c => c.plan === plan).length;
          return (
            <Card key={plan}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                    <p className="text-sm text-gray-500">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome, domínio ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Plan Filter */}
            <div className="w-full md:w-40">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Todos os planos</option>
                <option value="FREE">Gratuito</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativas</option>
                <option value="inactive">Suspensas</option>
              </select>
            </div>

            {/* Refresh */}
            <Button variant="outline" onClick={() => fetchCompanies()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma empresa encontrada
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || planFilter || statusFilter
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando uma nova empresa'}
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Empresa
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {companies.map((company) => (
                    <React.Fragment key={company.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-brand-green-100 dark:bg-brand-green-900/30">
                              <Building2 className="w-5 h-5 text-brand-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {company.name}
                              </p>
                              {company.websiteUrl && (
                                <p className="text-sm text-gray-500">{company.websiteUrl}</p>
                              )}
                              {company.cnpj && (
                                <p className="text-xs text-gray-400">{company.cnpj}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {company.contactEmail ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                <Crown className="w-3.5 h-3.5 text-yellow-500" />
                                Contato
                              </p>
                              <p className="text-xs text-gray-500">{company.contactEmail}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPlanBadge(company.plan)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(company)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              company.status === 'active'
                                ? 'text-green-600 bg-green-100 dark:bg-green-900/30 hover:bg-green-200'
                                : 'text-red-600 bg-red-100 dark:bg-red-900/30 hover:bg-red-200'
                            }`}
                          >
                            {company.status === 'active' ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Ativa
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Suspensa
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {company.currentUsers}/{company.maxUsers}
                            </span>
                            {company.currentWorkspaces !== undefined && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                {company.currentWorkspaces}
                              </span>
                            )}
                          </div>
                          {company.currentStorage !== undefined && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatStorage(company.currentStorage)} usado
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewDetailsId(viewDetailsId === company.id ? null : company.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(company)}
                              className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                              title={company.status === 'active' ? 'Suspender' : 'Ativar'}
                            >
                              {company.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openEditModal(company)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCompanyToDelete(company);
                                setDeleteModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded details row */}
                      {viewDetailsId === company.id && (
                        <tr>
                          <td colSpan={7} className="bg-gray-50 dark:bg-gray-800/30 px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Usuários</h4>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{company.currentUsers}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Workspaces</h4>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{company.currentWorkspaces || 0}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Limite Usuários</h4>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{company.maxUsers || 0}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Armazenamento</h4>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatStorage(company.currentStorage)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-500">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Modal */}
      <CompanyModal
        isOpen={companyModalOpen}
        onClose={() => {
          setCompanyModalOpen(false);
          setSelectedCompany(null);
        }}
        onSave={handleSaveCompany}
        company={selectedCompany}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCompanyToDelete(null);
        }}
        onConfirm={handleDeleteCompany}
        title="Excluir Empresa"
        description={`Tem certeza que deseja excluir a empresa "${companyToDelete?.name}"? Esta ação removerá todos os usuários, conteúdos e dados associados. Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
