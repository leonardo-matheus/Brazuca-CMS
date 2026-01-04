'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Crown,
  Eye,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Button, Card, CardContent, Input, Badge, Avatar } from '@/components/ui';
import { ConfirmModal } from '@/components/ui/Modal';
import { UserModal, UserData } from '@/components/modals';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import * as usersService from '@/services/users.service';
import * as companiesService from '@/services/companies.service';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  active: boolean;
  companyId?: string;
  companyName?: string;
  lastLogin?: string;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
}

// Role configuration
const roleConfig: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', icon: Crown, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  COMPANY_OWNER: { label: 'Dono da Empresa', icon: Crown, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  ADMIN: { label: 'Administrador', icon: Shield, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  USER: { label: 'Usuário', icon: Eye, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentUserRole = currentUser?.role?.toUpperCase().replace('-', '_') as UserData['role'];
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
  const isCompanyOwner = currentUserRole === 'COMPANY_OWNER';

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      if (isSuperAdmin) {
        result = await usersService.getAllUsers({
          page,
          size: 20,
          search: searchTerm || undefined,
          role: roleFilter || undefined,
          companyId: companyFilter ? Number(companyFilter) : undefined,
        });
      } else if (isCompanyOwner && currentUser?.companyId) {
        result = await usersService.getCompanyUsers(Number(currentUser.companyId), {
          page,
          size: 20,
          search: searchTerm || undefined,
          role: roleFilter || undefined,
        });
      } else {
        // Regular users can't see user list
        setUsers([]);
        setLoading(false);
        return;
      }

      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, isCompanyOwner, currentUser?.companyId, page, searchTerm, roleFilter, companyFilter]);

  // Fetch companies (for super admin)
  const fetchCompanies = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const result = await companiesService.getAllCompanies({ page: 0, size: 100 });
      setCompanies(result.companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Handle create/edit user
  const handleSaveUser = async (data: UserData) => {
    if (data.id) {
      // Update user
      await usersService.updateUser(data.id, {
        name: data.name,
        email: data.email,
        password: data.password || undefined,
        role: data.role as 'COMPANY_OWNER' | 'ADMIN' | 'USER',
        active: data.active,
      });
    } else {
      // Create user
      await usersService.createUser({
        name: data.name,
        email: data.email,
        password: data.password!,
        role: data.role as 'COMPANY_OWNER' | 'ADMIN' | 'USER',
        companyId: data.companyId ? Number(data.companyId) : undefined,
      });
    }
    fetchUsers();
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await usersService.deleteUser(userToDelete.id);
      toast.success('Usuário removido com sucesso');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover usuário');
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (user: User) => {
    try {
      await usersService.toggleUserStatus(user.id, !user.active);
      toast.success(`Usuário ${user.active ? 'desativado' : 'ativado'} com sucesso`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar status');
    }
  };

  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserData['role'],
      companyId: user.companyId,
      active: user.active,
    });
    setUserModalOpen(true);
  };

  // Open create modal
  const openCreateModal = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    const config = roleConfig[role] || roleConfig.USER;
    const IconComponent = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  if (!isSuperAdmin && !isCompanyOwner) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-500">
              Você não tem permissão para acessar esta página.
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
            <Users className="w-7 h-7" />
            Gerenciar Usuários
          </h1>
          <p className="text-gray-500 mt-1">
            {isSuperAdmin ? 'Gerencie todos os usuários do sistema' : 'Gerencie os usuários da sua empresa'}
          </p>
        </div>

        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
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
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Todas as funções</option>
                {isSuperAdmin && <option value="COMPANY_OWNER">Dono da Empresa</option>}
                <option value="ADMIN">Administrador</option>
                <option value="USER">Usuário</option>
              </select>
            </div>

            {/* Company Filter (Super Admin only) */}
            {isSuperAdmin && (
              <div className="w-full md:w-48">
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Todas as empresas</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Refresh */}
            <Button variant="outline" onClick={() => fetchUsers()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || roleFilter || companyFilter
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando um novo usuário'}
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Usuário
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    {isSuperAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acesso
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.companyName ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              {user.companyName}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            user.active
                              ? 'text-green-600 bg-green-100 dark:bg-green-900/30 hover:bg-green-200'
                              : 'text-red-600 bg-red-100 dark:bg-red-900/30 hover:bg-red-200'
                          }`}
                        >
                          {user.active ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              Inativo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca acessou'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
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

      {/* User Modal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
        user={selectedUser}
        currentUserRole={currentUserRole}
        companies={companies}
        currentCompanyId={currentUser?.companyId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${userToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
