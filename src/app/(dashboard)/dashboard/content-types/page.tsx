'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Box,
  Calendar,
  Layers,
  Filter,
  ChevronDown,
  GripVertical,
  Type,
  FileText,
  Hash,
  ToggleLeft,
  Image,
  Link2,
  Code,
  X,
  Check,
  Folder,
} from 'lucide-react';
import { Button, Card, CardContent, Input, Badge, Avatar } from '@/components/ui';
import { contentTypesService, FIELD_TYPES } from '@/services/content-types.service';
import { ContentType, ContentField } from '@/types';
import { toast } from '@/stores/toast.store';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const fieldTypeIcons: Record<string, React.ElementType> = {
  text: Type,
  richtext: FileText,
  number: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  media: Image,
  relation: Link2,
  json: Code,
};

export default function ContentTypesPage() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<ContentType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchContentTypes();
  }, []);

  const fetchContentTypes = async () => {
    try {
      setLoading(true);
      const response = await contentTypesService.getContentTypes({ search: searchQuery });
      setContentTypes(response.items);
    } catch (error) {
      toast.error('Erro ao carregar content types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchContentTypes();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      await contentTypesService.deleteContentType(id);
      toast.success('Content type excluído com sucesso');
      setDeleteConfirm(null);
      fetchContentTypes();
    } catch (error) {
      toast.error('Erro ao excluir content type');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tipos de Conteúdo</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie os modelos de conteúdo do seu projeto
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Novo Tipo de Conteúdo
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar tipos de conteúdo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="secondary">
          <Filter className="w-5 h-5 mr-2" />
          Filtros
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Content Types List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contentTypes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Box className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum tipo de conteúdo encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Crie seu primeiro content type para começar a estruturar seu conteúdo.
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Criar Tipo de Conteúdo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contentTypes.map((contentType) => (
            <Card
              key={contentType.id}
              className="hover:shadow-md transition-shadow group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-brand-green-100 dark:bg-brand-green-900/30 flex items-center justify-center">
                      <Box className="w-6 h-6 text-brand-green-600 dark:text-brand-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {contentType.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {contentType.description || `Slug: ${contentType.slug}`}
                      </p>
                      
                      {/* Fields Preview */}
                      <div className="flex flex-wrap gap-2">
                        {contentType.fields.slice(0, 5).map((field) => {
                          const IconComponent = fieldTypeIcons[field.type] || Type;
                          return (
                            <span
                              key={field.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            >
                              <IconComponent className="w-3.5 h-3.5" />
                              {field.name}
                              {field.required && (
                                <span className="text-red-500">*</span>
                              )}
                            </span>
                          );
                        })}
                        {contentType.fields.length > 5 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                            +{contentType.fields.length - 5} mais
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Meta */}
                  <div className="flex items-start gap-4">
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Layers className="w-4 h-4" />
                        <span>{contentType.fields.length} campos</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(contentType.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/content-types/${contentType.id}/categories`}
                        className="p-1.5 text-gray-500 hover:text-brand-green-600 hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Gerenciar Categorias"
                      >
                        <Folder className="w-4 h-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingType(contentType)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {deleteConfirm === contentType.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(contentType.id)}
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
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(contentType.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingType) && (
        <ContentTypeModal
          contentType={editingType}
          onClose={() => {
            setShowCreateModal(false);
            setEditingType(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setEditingType(null);
            fetchContentTypes();
          }}
        />
      )}
    </div>
  );
}

// Content Type Modal Component
function ContentTypeModal({
  contentType,
  onClose,
  onSave,
}: {
  contentType: ContentType | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(contentType?.name || '');
  const [slug, setSlug] = useState(contentType?.slug || '');
  const [description, setDescription] = useState(contentType?.description || '');
  const [fields, setFields] = useState<ContentField[]>(contentType?.fields || []);
  const [saving, setSaving] = useState(false);
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!contentType) {
      setSlug(generateSlug(value));
    }
  };

  const addField = (type: string) => {
    const newField: ContentField = {
      id: `field-${Date.now()}`,
      name: '',
      type: type as ContentField['type'],
      required: false,
      unique: false,
    };
    setFields([...fields, newField]);
    setShowFieldSelector(false);
  };

  const updateField = (id: string, updates: Partial<ContentField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setSaving(true);
      if (contentType) {
        await contentTypesService.updateContentType(contentType.id, {
          name,
          slug,
          description,
          fields,
        });
        toast.success('Tipo de conteúdo atualizado com sucesso');
      } else {
        await contentTypesService.createContentType({
          name,
          slug,
          description,
          fields,
        });
        toast.success('Tipo de conteúdo criado com sucesso');
      }
      onSave();
    } catch (error) {
      toast.error('Erro ao salvar tipo de conteúdo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {contentType ? 'Editar Tipo de Conteúdo' : 'Novo Tipo de Conteúdo'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome *
              </label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Article, Product, Author"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Uma breve descrição do content type"
            />
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Campos
              </label>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFieldSelector(!showFieldSelector)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Campo
              </Button>
            </div>

            {/* Field Type Selector */}
            {showFieldSelector && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Selecione o tipo de campo:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {FIELD_TYPES.map((fieldType) => {
                    const IconComponent = fieldTypeIcons[fieldType.value] || Type;
                    return (
                      <button
                        key={fieldType.value}
                        onClick={() => addField(fieldType.value)}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-green-500 hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20 transition-colors"
                      >
                        <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {fieldType.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fields List */}
            <div className="space-y-3">
              {fields.map((field, index) => {
                const IconComponent = fieldTypeIcons[field.type] || Type;
                return (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <IconComponent className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {field.type}
                      </span>
                    </div>
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      placeholder="Nome do campo"
                      className="flex-1"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-600 dark:text-gray-400">Required</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.unique}
                        onChange={(e) => updateField(field.id, { unique: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-600 dark:text-gray-400">Unique</span>
                    </label>
                    <button
                      onClick={() => removeField(field.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum campo adicionado ainda</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : contentType ? 'Salvar Alterações' : 'Criar Content Type'}
          </Button>
        </div>
      </div>
    </div>
  );
}
