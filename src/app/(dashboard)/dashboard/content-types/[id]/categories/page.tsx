'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Folder,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button, Card, CardContent, Input, Badge } from '@/components/ui';
import { categoriesService, Category, CreateCategoryData } from '@/services/categories.service';
import { contentTypesService } from '@/services/content-types.service';
import { ContentType } from '@/types';
import { toast } from '@/stores/toast.store';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const contentTypeId = params.id as string;
  
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ name: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', parentId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contentTypeId) {
      fetchContentType();
      fetchCategories();
    }
  }, [contentTypeId]);

  const fetchContentType = async () => {
    try {
      const ct = await contentTypesService.getContentType(contentTypeId);
      setContentType(ct);
    } catch (error) {
      toast.error('Erro ao carregar tipo de conteúdo');
      router.push('/dashboard/content-types');
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.getCategories(contentTypeId);
      setCategories(data);
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build category tree
  const rootCategories = filteredCategories.filter(c => !c.parentId);
  const childCategories = (parentId: string) => filteredCategories.filter(c => c.parentId === parentId);

  // Create new category
  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    setSaving(true);
    try {
      await categoriesService.createCategory(contentTypeId, {
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || undefined,
        parentId: newCategory.parentId || undefined,
      });
      toast.success('Categoria criada com sucesso');
      setNewCategory({ name: '', description: '', parentId: '' });
      setIsCreating(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar categoria');
    } finally {
      setSaving(false);
    }
  };

  // Start editing
  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat.id);
    setEditValue({ name: cat.name, description: cat.description || '' });
  };

  // Save edit
  const handleSaveEdit = async (catId: string) => {
    if (!editValue.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    setSaving(true);
    try {
      await categoriesService.updateCategory(contentTypeId, catId, {
        name: editValue.name.trim(),
        description: editValue.description.trim() || undefined,
      });
      toast.success('Categoria atualizada');
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar categoria');
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDelete = async (catId: string) => {
    try {
      await categoriesService.deleteCategory(contentTypeId, catId);
      toast.success('Categoria excluída');
      setDeleteConfirm(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir categoria');
    }
  };

  // Render category item
  const renderCategoryItem = (cat: Category, level: number = 0) => {
    const children = childCategories(cat.id);
    const isEditing = editingCategory === cat.id;

    return (
      <div key={cat.id} style={{ marginLeft: level * 24 }}>
        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg group">
          <div className="w-8 h-8 rounded-lg bg-brand-green-100 dark:bg-brand-green-900/30 flex items-center justify-center flex-shrink-0">
            <Folder className="w-4 h-4 text-brand-green-600 dark:text-brand-green-400" />
          </div>

          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="text"
                value={editValue.name}
                onChange={(e) => setEditValue(prev => ({ ...prev, name: e.target.value }))}
                className="h-8 text-sm flex-1"
                placeholder="Nome da categoria"
                autoFocus
              />
              <Input
                type="text"
                value={editValue.description}
                onChange={(e) => setEditValue(prev => ({ ...prev, description: e.target.value }))}
                className="h-8 text-sm flex-1"
                placeholder="Descrição (opcional)"
              />
              <button
                onClick={() => handleSaveEdit(cat.id)}
                disabled={saving}
                className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {cat.name}
                  </h3>
                  {children.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {children.length} subcategorias
                    </Badge>
                  )}
                </div>
                {cat.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setNewCategory({ name: '', description: '', parentId: cat.id });
                    setIsCreating(true);
                  }}
                  className="p-1.5 text-gray-500 hover:text-brand-green-600 hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20 rounded"
                  title="Adicionar subcategoria"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleStartEdit(cat)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {deleteConfirm === cat.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(cat.id)}
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
                    onClick={() => setDeleteConfirm(cat.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Render children */}
        {children.length > 0 && (
          <div className="border-l-2 border-gray-100 dark:border-gray-800 ml-4">
            {children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/content-types"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/dashboard/content-types" className="hover:text-brand-green-600">
                Tipos de Conteúdo
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>{contentType?.name || 'Carregando...'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Categorias
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gerencie as categorias deste tipo de conteúdo
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsCreating(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar categorias..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              {newCategory.parentId 
                ? `Nova subcategoria de "${categories.find(c => c.id === newCategory.parentId)?.name}"`
                : 'Nova categoria'
              }
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome *
                </label>
                <Input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da categoria"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <Input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição opcional"
                />
              </div>
            </div>
            {!newCategory.parentId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria Pai (opcional)
                </label>
                <select
                  value={newCategory.parentId}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, parentId: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Nenhuma (categoria raiz)</option>
                  {categories.filter(c => !c.parentId).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false);
                  setNewCategory({ name: '', description: '', parentId: '' });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Criar Categoria
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      {loading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria criada'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery 
                ? 'Tente buscar por outro termo.' 
                : 'Categorias ajudam a organizar as entradas deste tipo de conteúdo.'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setIsCreating(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Categoria
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              {rootCategories.map(cat => renderCategoryItem(cat))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {!loading && categories.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Total: {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
        </div>
      )}
    </div>
  );
}
