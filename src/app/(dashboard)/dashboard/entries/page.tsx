'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  Filter,
  ChevronDown,
  Grid3X3,
  List,
  Check,
  X,
  ExternalLink,
  Clock,
  User,
  Tag,
  Archive,
  RotateCcw,
  History,
  Send,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Button, Card, CardContent, Input, Badge, Avatar } from '@/components/ui';
import { entriesService, EntriesFilters, EntryVersion } from '@/services/entries.service';
import { contentTypesService } from '@/services/content-types.service';
import { ContentEntry, ContentType } from '@/types';
import { toast } from '@/stores/toast.store';
import { cn } from '@/lib/utils';
import { EntryModal } from '@/components/modals/EntryModal';

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  archived: { label: 'Arquivado', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export default function EntriesPage() {
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ContentEntry | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  
  // Action states
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  // Version history
  const [versionsModal, setVersionsModal] = useState<{ entryId: string; title: string } | null>(null);
  const [versions, setVersions] = useState<EntryVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    fetchContentTypes();
    fetchEntries();
  }, []);

  const fetchContentTypes = async () => {
    try {
      const response = await contentTypesService.getContentTypes();
      setContentTypes(response.items);
    } catch (error) {
      console.error('Error fetching content types:', error);
    }
  };

  const fetchEntries = async (filters?: EntriesFilters) => {
    try {
      setLoading(true);
      const response = await entriesService.getEntries({
        search: searchQuery,
        contentTypeId: selectedType || undefined,
        status: selectedStatus as ContentEntry['status'] || undefined,
        ...filters,
      });
      setEntries(response.items);
      setPagination({
        page: response.page,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (error) {
      toast.error('Erro ao carregar entradas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchEntries();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedType, selectedStatus]);

  const handleDelete = async (id: string) => {
    try {
      await entriesService.deleteEntry(id);
      toast.success('Entrada excluída com sucesso');
      setDeleteConfirm(null);
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao excluir entrada');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    try {
      await entriesService.bulkDeleteEntries(selectedEntries);
      toast.success(`${selectedEntries.length} entradas excluídas`);
      setSelectedEntries([]);
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao excluir entradas');
    }
  };

  const handleBulkPublish = async () => {
    if (selectedEntries.length === 0) return;
    try {
      await entriesService.bulkPublishEntries(selectedEntries);
      toast.success(`${selectedEntries.length} entradas publicadas`);
      setSelectedEntries([]);
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao publicar entradas');
    }
  };

  const toggleSelectEntry = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEntries.length === entries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(entries.map((e) => e.id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Open modal for new entry
  const handleNewEntry = (contentType: ContentType) => {
    setSelectedContentType(contentType);
    setEditingEntry(null);
    setIsModalOpen(true);
    setShowTypeSelector(false);
  };

  // Open modal for editing
  const handleEditEntry = (entry: ContentEntry) => {
    const ct = contentTypes.find(c => c.id === entry.contentTypeId || c.name === entry.contentTypeName);
    if (ct) {
      setSelectedContentType(ct);
      setEditingEntry(entry);
      setIsModalOpen(true);
    } else {
      toast.error('Tipo de conteúdo não encontrado');
    }
    setActionMenuId(null);
  };

  // Workflow actions
  const handlePublish = async (entryId: string) => {
    setProcessingAction(entryId);
    try {
      await entriesService.publishEntry(entryId, { publishImmediately: true });
      toast.success('Entrada publicada com sucesso');
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao publicar entrada');
    } finally {
      setProcessingAction(null);
      setActionMenuId(null);
    }
  };

  const handleUnpublish = async (entryId: string) => {
    setProcessingAction(entryId);
    try {
      await entriesService.unpublishEntry(entryId);
      toast.success('Entrada despublicada');
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao despublicar entrada');
    } finally {
      setProcessingAction(null);
      setActionMenuId(null);
    }
  };

  const handleArchive = async (entryId: string) => {
    setProcessingAction(entryId);
    try {
      await entriesService.archiveEntry(entryId);
      toast.success('Entrada arquivada');
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao arquivar entrada');
    } finally {
      setProcessingAction(null);
      setActionMenuId(null);
    }
  };

  const handleRestore = async (entryId: string) => {
    setProcessingAction(entryId);
    try {
      await entriesService.restoreEntry(entryId);
      toast.success('Entrada restaurada');
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao restaurar entrada');
    } finally {
      setProcessingAction(null);
      setActionMenuId(null);
    }
  };

  // View versions
  const handleViewVersions = async (entry: ContentEntry) => {
    setVersionsModal({ entryId: entry.id, title: entry.title });
    setLoadingVersions(true);
    setActionMenuId(null);
    try {
      const v = await entriesService.getEntryVersions(entry.id);
      setVersions(v);
    } catch (error) {
      toast.error('Erro ao carregar versões');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (entryId: string, versionNumber: number) => {
    try {
      await entriesService.restoreEntryVersion(entryId, versionNumber);
      toast.success(`Versão ${versionNumber} restaurada`);
      setVersionsModal(null);
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao restaurar versão');
    }
  };

  // Bulk actions
  const handleBulkArchive = async () => {
    if (selectedEntries.length === 0) return;
    try {
      await entriesService.bulkArchiveEntries(selectedEntries);
      toast.success(`${selectedEntries.length} entradas arquivadas`);
      setSelectedEntries([]);
      fetchEntries();
    } catch (error) {
      toast.error('Erro ao arquivar entradas');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entradas</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie todo o conteúdo do seu projeto
          </p>
        </div>
        <div className="relative">
          <Button variant="primary" onClick={() => setShowTypeSelector(!showTypeSelector)}>
            <Plus className="w-5 h-5 mr-2" />
            Nova Entrada
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
          
          {/* Content Type Selector Dropdown */}
          {showTypeSelector && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Selecione o tipo de conteúdo
              </div>
              {contentTypes.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  Nenhum tipo de conteúdo disponível
                </div>
              ) : (
                contentTypes.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => handleNewEntry(ct)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    {ct.name}
                    <span className="text-xs text-gray-400 ml-auto">{ct.slug}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search, Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar entradas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {/* Content Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">Todos os tipos</option>
            {contentTypes.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="scheduled">Agendado</option>
            <option value="archived">Arquivado</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'table'
                  ? 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600'
                  : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600'
                  : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEntries.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-brand-green-50 dark:bg-brand-green-900/20 rounded-lg">
          <span className="text-sm font-medium text-brand-green-700 dark:text-brand-green-300">
            {selectedEntries.length} selecionado(s)
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleBulkPublish}>
              <Send className="w-4 h-4 mr-1" />
              Publicar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBulkArchive}>
              <Archive className="w-4 h-4 mr-1" />
              Arquivar
            </Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedEntries([])}>
              Limpar seleção
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma entrada encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Crie sua primeira entrada de conteúdo.
            </p>
            <Button variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Nova Entrada
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedEntries.length === entries.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Título
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tipo
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Autor
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Atualizado
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => toggleSelectEntry(entry.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {entry.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        /{entry.slug}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        <Tag className="w-3 h-3" />
                        {entry.contentTypeName}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                          statusConfig[entry.status].color
                        )}
                      >
                        {statusConfig[entry.status].label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={entry.author.avatar}
                          alt={entry.author.name}
                          size="sm"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {entry.author.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(entry.updatedAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => handleEditEntry(entry)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {/* Actions Menu */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => setActionMenuId(actionMenuId === entry.id ? null : entry.id)}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                          
                          {actionMenuId === entry.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                              {processingAction === entry.id ? (
                                <div className="px-3 py-2 flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                              ) : (
                                <>
                                  {/* Workflow Actions based on status */}
                                  {entry.status === 'draft' && (
                                    <button
                                      onClick={() => handlePublish(entry.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                    >
                                      <Send className="w-4 h-4 text-green-500" />
                                      Publicar
                                    </button>
                                  )}
                                  
                                  {entry.status === 'published' && (
                                    <button
                                      onClick={() => handleUnpublish(entry.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                    >
                                      <EyeOff className="w-4 h-4 text-gray-500" />
                                      Despublicar
                                    </button>
                                  )}
                                  
                                  {entry.status === 'scheduled' && (
                                    <button
                                      onClick={() => handleUnpublish(entry.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                    >
                                      <X className="w-4 h-4 text-gray-500" />
                                      Cancelar Agendamento
                                    </button>
                                  )}
                                  
                                  {entry.status !== 'archived' ? (
                                    <button
                                      onClick={() => handleArchive(entry.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                    >
                                      <Archive className="w-4 h-4 text-yellow-500" />
                                      Arquivar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleRestore(entry.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                    >
                                      <RotateCcw className="w-4 h-4 text-blue-500" />
                                      Restaurar
                                    </button>
                                  )}
                                  
                                  <div className="border-t dark:border-gray-700 my-1" />
                                  
                                  <button
                                    onClick={() => handleViewVersions(entry)}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                  >
                                    <History className="w-4 h-4 text-gray-500" />
                                    Ver Versões
                                  </button>
                                  
                                  <div className="border-t dark:border-gray-700 my-1" />
                                  
                                  <button
                                    onClick={() => setDeleteConfirm(entry.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir Permanentemente
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Delete Confirmation */}
                        {deleteConfirm === entry.id && (
                          <div className="absolute right-0 top-0 flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                            <span className="text-xs text-gray-500 px-2">Confirmar?</span>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="hover:shadow-md transition-shadow group overflow-hidden"
            >
              {/* Thumbnail placeholder */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                    {entry.title}
                  </h3>
                  <input
                    type="checkbox"
                    checked={selectedEntries.includes(entry.id)}
                    onChange={() => toggleSelectEntry(entry.id)}
                    className="rounded border-gray-300 mt-1"
                  />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      statusConfig[entry.status].color
                    )}
                  >
                    {statusConfig[entry.status].label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.contentTypeName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={entry.author.avatar}
                      alt={entry.author.name}
                      size="xs"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.author.name}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {entries.length} de {pagination.total} entradas
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchEntries({ page: pagination.page - 1 })}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchEntries({ page: pagination.page + 1 })}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {selectedContentType && (
        <EntryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
            setSelectedContentType(null);
          }}
          onSave={fetchEntries}
          entry={editingEntry}
          contentType={selectedContentType}
          contentTypes={contentTypes}
        />
      )}

      {/* Versions Modal */}
      {versionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Histórico de Versões
                </h2>
                <p className="text-sm text-gray-500">{versionsModal.title}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setVersionsModal(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loadingVersions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma versão anterior encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.versionNumber}
                      className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Versão {version.versionNumber}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {version.changeSummary || 'Sem descrição'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Por {version.changedBy.name} em {formatDate(version.createdAt)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreVersion(versionsModal.entryId, version.versionNumber)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {(actionMenuId || showTypeSelector) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setActionMenuId(null);
            setShowTypeSelector(false);
          }}
        />
      )}
    </div>
  );
}
