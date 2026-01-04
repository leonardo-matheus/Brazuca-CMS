'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Tag as TagIcon,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  Hash,
  Calendar,
} from 'lucide-react';
import { Button, Card, CardContent, Input, Badge } from '@/components/ui';
import { tagsService, Tag, CreateTagData } from '@/services/tags.service';
import { toast } from '@/stores/toast.store';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const data = await tagsService.getTags();
      setTags(data);
    } catch (error) {
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  // Filter tags by search
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create new tag
  const handleCreate = async () => {
    if (!newTagName.trim()) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    setSaving(true);
    try {
      await tagsService.createTag({ name: newTagName.trim() });
      toast.success('Tag criada com sucesso');
      setNewTagName('');
      setIsCreating(false);
      fetchTags();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar tag');
    } finally {
      setSaving(false);
    }
  };

  // Start editing
  const handleStartEdit = (tag: Tag) => {
    setEditingTag(tag.id);
    setEditValue(tag.name);
  };

  // Save edit
  const handleSaveEdit = async (tagId: string) => {
    if (!editValue.trim()) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    setSaving(true);
    try {
      await tagsService.updateTag(tagId, { name: editValue.trim() });
      toast.success('Tag atualizada');
      setEditingTag(null);
      fetchTags();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar tag');
    } finally {
      setSaving(false);
    }
  };

  // Delete tag
  const handleDelete = async (tagId: string) => {
    try {
      await tagsService.deleteTag(tagId);
      toast.success('Tag excluída');
      setDeleteConfirm(null);
      fetchTags();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir tag');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie as tags globais do seu workspace
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreating(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nova Tag
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nome da nova tag..."
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <TagIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Nenhuma tag encontrada' : 'Nenhuma tag criada'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery 
                ? 'Tente buscar por outro termo.' 
                : 'Tags ajudam a organizar e categorizar seu conteúdo.'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setIsCreating(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Tag
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((tag) => (
            <Card key={tag.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-green-100 dark:bg-brand-green-900/30 flex items-center justify-center flex-shrink-0">
                      <TagIcon className="w-5 h-5 text-brand-green-600 dark:text-brand-green-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {editingTag === tag.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(tag.id);
                              if (e.key === 'Escape') setEditingTag(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(tag.id)}
                            disabled={saving}
                            className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEditingTag(null)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {tag.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            <Hash className="w-3 h-3 inline-block mr-1" />
                            {tag.slug}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {editingTag !== tag.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(tag)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {deleteConfirm === tag.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(tag.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            title="Confirmar exclusão"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(tag.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Meta Info */}
                <div className="mt-3 pt-3 border-t dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {tag.usageCount || 0} {(tag.usageCount || 0) === 1 ? 'uso' : 'usos'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(tag.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && tags.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Total: {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
        </div>
      )}
    </div>
  );
}
