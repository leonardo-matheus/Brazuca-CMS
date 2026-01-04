'use client';

import React from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Modal,
} from '@/components/ui';
import { contentService } from '@/services/content.service';
import type { ContentEntry } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import { toast } from '@/stores/toast.store';

export default function ContentPage() {
  const [entries, setEntries] = React.useState<ContentEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedEntry, setSelectedEntry] = React.useState<ContentEntry | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const data = await contentService.getEntries({ page: 1, perPage: 20 });
      setEntries(data.items);
    } catch (error) {
      toast.error('Erro ao carregar conteúdos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;

    try {
      await contentService.deleteEntry(selectedEntry.id);
      setEntries((prev) => prev.filter((e) => e.id !== selectedEntry.id));
      toast.success('Conteúdo excluído com sucesso');
      setDeleteModalOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      toast.error('Erro ao excluir conteúdo');
    }
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      published: 'success',
      draft: 'warning',
      archived: 'default',
    };
    const labels: Record<string, string> = {
      published: 'Publicado',
      draft: 'Rascunho',
      archived: 'Arquivado',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conteúdos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie todos os seus conteúdos em um só lugar.</p>
        </div>
        <Button variant="primary">
          <Plus className="w-5 h-5 mr-2" />
          Novo Conteúdo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por título ou slug..."
                leftIcon={<Search className="w-5 h-5" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os conteúdos ({filteredEntries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Título
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Slug
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Atualizado
                  </th>
                  <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{entry.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {truncate(entry.data?.description || 'Sem descrição', 50)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded">
                        {entry.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(entry.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(entry.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button
                          onClick={() =>
                            setActiveMenu(activeMenu === entry.id ? null : entry.id)
                          }
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {activeMenu === entry.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <Eye className="w-4 h-4" />
                              Visualizar
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <Edit className="w-4 h-4" />
                              Editar
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <Copy className="w-4 h-4" />
                              Duplicar
                            </button>
                            <hr className="my-2 dark:border-gray-700" />
                            <button
                              onClick={() => {
                                setSelectedEntry(entry);
                                setDeleteModalOpen(true);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEntries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Nenhum conteúdo encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir conteúdo"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tem certeza que deseja excluir <strong className="dark:text-white">{selectedEntry?.title}</strong>? Esta
          ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
