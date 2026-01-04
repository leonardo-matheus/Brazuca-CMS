'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Image,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  Key,
  Settings,
  CheckCircle2,
  Circle,
  ArrowRight,
  Layers,
  RefreshCw,
  Sparkles,
  Zap,
  Database,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar } from '@/components/ui';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardStats, ActivityLog } from '@/types';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Getting Started Checklist
  const [checklist, setChecklist] = useState({
    createContentType: false,
    createEntry: false,
    uploadMedia: false,
    generateApiKey: false,
    inviteMember: false,
  });

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      
      const [statsData, activitiesData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentActivity(),
      ]);
      
      setStats(statsData);
      setActivities(activitiesData);
      setLastRefresh(new Date());

      // Atualizar checklist baseado nos dados
      setChecklist({
        createContentType: (statsData?.totalContentTypes || 0) > 0,
        createEntry: (statsData?.totalEntries || 0) > 0,
        uploadMedia: (statsData?.totalMedia || 0) > 0,
        generateApiKey: true, // Mock - assumir que já tem
        inviteMember: (statsData?.teamMembers || 0) > 1,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const statCards = [
    {
      title: 'Total de Entradas',
      value: stats?.totalEntries || 0,
      change: stats?.entriesChange || 0,
      icon: FileText,
      color: 'green',
      href: '/dashboard/entries',
    },
    {
      title: 'Tipos de Conteúdo',
      value: stats?.totalContentTypes || 0,
      change: 0,
      icon: Layers,
      color: 'blue',
      href: '/dashboard/content-types',
    },
    {
      title: 'Arquivos de Mídia',
      value: stats?.totalMedia || 0,
      change: 0,
      icon: Image,
      color: 'yellow',
      href: '/dashboard/media',
    },
    {
      title: 'Chaves API',
      value: stats?.totalApiKeys || 0,
      change: 0,
      icon: Activity,
      color: 'purple',
      href: '/dashboard/api-keys',
    },
  ];

  const quickActions = [
    {
      label: 'Novo Tipo de Conteúdo',
      description: 'Crie a estrutura dos seus dados',
      icon: Layers,
      href: '/dashboard/content-types',
      color: 'brand-green',
    },
    {
      label: 'Nova Entrada',
      description: 'Adicione conteúdo ao seu projeto',
      icon: FileText,
      href: '/dashboard/entries',
      color: 'blue',
    },
    {
      label: 'Upload de Mídia',
      description: 'Envie imagens e arquivos',
      icon: Image,
      href: '/dashboard/media',
      color: 'yellow',
    },
    {
      label: 'Gerar Chave API',
      description: 'Conecte suas aplicações',
      icon: Key,
      href: '/dashboard/api-keys',
      color: 'purple',
    },
  ];

  const checklistItems = [
    {
      id: 'createContentType',
      label: 'Criar seu primeiro Tipo de Conteúdo',
      description: 'Defina a estrutura dos seus dados',
      href: '/dashboard/content-types',
      completed: checklist.createContentType,
    },
    {
      id: 'createEntry',
      label: 'Criar sua primeira Entrada',
      description: 'Adicione conteúdo ao seu CMS',
      href: '/dashboard/entries',
      completed: checklist.createEntry,
    },
    {
      id: 'uploadMedia',
      label: 'Fazer upload de mídia',
      description: 'Envie imagens e arquivos',
      href: '/dashboard/media',
      completed: checklist.uploadMedia,
    },
    {
      id: 'generateApiKey',
      label: 'Gerar uma chave de API',
      description: 'Conecte seu frontend',
      href: '/dashboard/api-keys',
      completed: checklist.generateApiKey,
    },
    {
      id: 'inviteMember',
      label: 'Convidar um membro da equipe',
      description: 'Colabore com sua equipe',
      href: '/dashboard/settings',
      completed: checklist.inviteMember,
    },
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const isAllCompleted = completedCount === totalCount;

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'criou',
      update: 'atualizou',
      delete: 'excluiu',
      publish: 'publicou',
      unpublish: 'despublicou',
    };
    return labels[action] || action;
  };

  const getBadgeVariant = (action: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      create: 'success',
      update: 'info',
      delete: 'danger',
      publish: 'success',
      unpublish: 'warning',
    };
    return variants[action] || 'default';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            {refreshing && (
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Bem-vindo de volta! Aqui está o resumo do seu projeto.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
            Atualizar
          </Button>
          <Button variant="primary" onClick={() => router.push('/dashboard/entries')}>
            <Plus className="w-5 h-5 mr-2" />
            Novo Conteúdo
          </Button>
        </div>
      </div>

      {/* Stats Cards - Clicáveis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:border-brand-green-500 dark:hover:border-brand-green-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110',
                      stat.color === 'green' && 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400',
                      stat.color === 'yellow' && 'bg-brand-yellow-100 dark:bg-brand-yellow-900/30 text-brand-yellow-600 dark:text-brand-yellow-400',
                      stat.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                      stat.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    )}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                  {stat.change !== 0 && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-sm font-medium',
                        stat.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {stat.change > 0 ? '+' : ''}{stat.change}%
                      {stat.change >= 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-brand-green-500 transition-colors">
                    {stat.title}
                  </p>
                </div>
                <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-green-500" />
              Atividade Recente
            </CardTitle>
            <Badge variant="secondary" size="sm">
              Auto-atualiza
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer group"
                  >
                    <Avatar src={activity.user.avatar} name={activity.user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.user.name}</span>{' '}
                        <span className="text-gray-500 dark:text-gray-400">
                          {getActionLabel(activity.action)}
                        </span>{' '}
                        <span className="font-medium text-brand-green-600 dark:text-brand-green-400">
                          {activity.entityName}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge variant={getBadgeVariant(activity.action)} size="sm">
                      {activity.action === 'create' ? 'Criado' : 
                       activity.action === 'update' ? 'Editado' :
                       activity.action === 'delete' ? 'Excluído' :
                       activity.action === 'publish' ? 'Publicado' :
                       activity.action === 'unpublish' ? 'Despublicado' : activity.action}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Nenhuma atividade recente</p>
                  <p className="text-sm mt-1">Comece criando seu primeiro conteúdo!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-yellow-500" />
              Primeiros Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isAllCompleted ? '🎉 Tudo pronto!' : 'Seu progresso'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-green-500 to-brand-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {checklistItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg transition-all duration-200',
                    item.completed
                      ? 'bg-brand-green-50 dark:bg-brand-green-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        item.completed
                          ? 'text-brand-green-700 dark:text-brand-green-400 line-through'
                          : 'text-gray-900 dark:text-white'
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  {!item.completed && (
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-yellow-500" />
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="hover:border-brand-green-500 dark:hover:border-brand-green-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110',
                      action.color === 'brand-green' && 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400',
                      action.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                      action.color === 'yellow' && 'bg-brand-yellow-100 dark:bg-brand-yellow-900/30 text-brand-yellow-600 dark:text-brand-yellow-400',
                      action.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    )}
                  >
                    <action.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-green-500 transition-colors">
                    {action.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-green-100 dark:bg-brand-green-900/30 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-brand-green-600 dark:text-brand-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Armazenamento</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats?.storageUsed || 0} GB de {stats?.storageLimit || 10} GB utilizados
                </p>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    ((stats?.storageUsed || 0) / (stats?.storageLimit || 10)) > 0.8
                      ? 'bg-red-500'
                      : 'bg-gradient-to-r from-brand-green-500 to-brand-yellow-500'
                  )}
                  style={{
                    width: `${((stats?.storageUsed || 0) / (stats?.storageLimit || 10)) * 100}%`,
                  }}
                />
              </div>
              {((stats?.storageUsed || 0) / (stats?.storageLimit || 10)) > 0.8 && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Armazenamento quase cheio! Considere fazer upgrade.
                </p>
              )}
            </div>
            <Link href="/dashboard/settings">
              <Button variant="secondary" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
