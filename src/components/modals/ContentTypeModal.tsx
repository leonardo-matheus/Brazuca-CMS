'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Type,
  Hash,
  AlignLeft,
  Calendar,
  ToggleLeft,
  Image,
  Link2,
  Code,
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  Loader2,
  Save,
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from '@/stores/toast.store';

// Field type definitions
export const FIELD_TYPES = [
  { value: 'text', label: 'Texto', icon: Type, description: 'Texto curto, títulos, nomes' },
  { value: 'richtext', label: 'Rich Text', icon: AlignLeft, description: 'Conteúdo formatado com HTML' },
  { value: 'number', label: 'Número', icon: Hash, description: 'Números inteiros ou decimais' },
  { value: 'boolean', label: 'Booleano', icon: ToggleLeft, description: 'Toggle verdadeiro/falso' },
  { value: 'date', label: 'Data', icon: Calendar, description: 'Seletor de data e hora' },
  { value: 'media', label: 'Mídia', icon: Image, description: 'Imagens, vídeos, arquivos' },
  { value: 'relation', label: 'Relação', icon: Link2, description: 'Link para outro conteúdo' },
  { value: 'json', label: 'JSON', icon: Code, description: 'Dados JSON raw' },
] as const;

export interface ContentField {
  id: string;
  name: string;
  type: typeof FIELD_TYPES[number]['value'];
  label: string;
  required: boolean;
  unique: boolean;
  defaultValue?: any;
  validation?: Record<string, any>;
  description?: string;
}

export interface ContentTypeData {
  id?: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  fields: ContentField[];
}

interface ContentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContentTypeData) => Promise<void>;
  contentType?: ContentTypeData | null;
}

// Generate unique ID
function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate slug from name
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]+/g, '')
    .replace(/__+/g, '_');
}

export function ContentTypeModal({
  isOpen,
  onClose,
  onSave,
  contentType,
}: ContentTypeModalProps) {
  const [formData, setFormData] = useState<ContentTypeData>({
    name: '',
    displayName: '',
    description: '',
    icon: '📄',
    fields: [],
  });
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const isEditing = !!contentType?.id;

  useEffect(() => {
    if (contentType) {
      setFormData({
        ...contentType,
        fields: contentType.fields || [],
      });
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        icon: '📄',
        fields: [],
      });
    }
    setErrors({});
    setExpandedField(null);
  }, [contentType, isOpen]);

  // Auto-generate name from displayName
  useEffect(() => {
    if (!isEditing && formData.displayName) {
      setFormData((prev) => ({
        ...prev,
        name: slugify(prev.displayName),
      }));
    }
  }, [formData.displayName, isEditing]);

  // Drag and drop handlers
  const handleDragStart = useCallback((fieldId: string) => {
    setDraggedField(fieldId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedField || draggedField === targetId) return;

    setFormData((prev) => {
      const fields = [...prev.fields];
      const draggedIndex = fields.findIndex((f) => f.id === draggedField);
      const targetIndex = fields.findIndex((f) => f.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [draggedItem] = fields.splice(draggedIndex, 1);
      fields.splice(targetIndex, 0, draggedItem);

      return { ...prev, fields };
    });
  }, [draggedField]);

  const handleDragEnd = useCallback(() => {
    setDraggedField(null);
  }, []);

  // Field management
  const addField = useCallback(() => {
    const newField: ContentField = {
      id: generateId(),
      name: '',
      type: 'text',
      label: '',
      required: false,
      unique: false,
    };
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setExpandedField(newField.id);
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<ContentField>) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              ...updates,
              // Auto-generate name from label if not editing name directly
              name: updates.label && !updates.name ? slugify(updates.label) : (updates.name ?? f.name),
            }
          : f
      ),
    }));
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId),
    }));
    if (expandedField === fieldId) {
      setExpandedField(null);
    }
  }, [expandedField]);

  const duplicateField = useCallback((field: ContentField) => {
    const newField: ContentField = {
      ...field,
      id: generateId(),
      name: `${field.name}_copy`,
      label: `${field.label} (Cópia)`,
    };
    setFormData((prev) => {
      const index = prev.fields.findIndex((f) => f.id === field.id);
      const fields = [...prev.fields];
      fields.splice(index + 1, 0, newField);
      return { ...prev, fields };
    });
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Nome de exibição é obrigatório';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome (slug) é obrigatório';
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.name)) {
      newErrors.name = 'Nome deve começar com letra e conter apenas letras minúsculas, números e underscore';
    }

    if (formData.fields.length === 0) {
      newErrors.fields = 'Adicione pelo menos um campo';
    }

    // Validate each field
    formData.fields.forEach((field, index) => {
      if (!field.label.trim()) {
        newErrors[`field_${field.id}_label`] = 'Label é obrigatório';
      }
      if (!field.name.trim()) {
        newErrors[`field_${field.id}_name`] = 'Nome do campo é obrigatório';
      }
      // Check for duplicate field names
      const duplicateNames = formData.fields.filter((f) => f.name === field.name);
      if (duplicateNames.length > 1) {
        newErrors[`field_${field.id}_name`] = 'Nome do campo deve ser único';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Verifique os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      toast.success(isEditing ? 'Tipo de conteúdo atualizado!' : 'Tipo de conteúdo criado!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar tipo de conteúdo');
    } finally {
      setSaving(false);
    }
  };

  const getFieldIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find((t) => t.value === type);
    return fieldType ? fieldType.icon : Type;
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Tipo de Conteúdo' : 'Novo Tipo de Conteúdo'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome de Exibição *
            </label>
            <Input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Ex: Artigos do Blog"
              error={errors.displayName}
            />
            {errors.displayName && (
              <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug (API) *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
              placeholder="Ex: articles"
              error={errors.name}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <Input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição opcional do tipo de conteúdo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ícone
            </label>
            <Input
              type="text"
              value={formData.icon || ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="📄"
              className="text-center text-xl"
            />
          </div>
        </div>

        {/* Fields Section */}
        <div className="border-t dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Campos
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addField}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>

          {errors.fields && (
            <p className="text-red-500 text-sm mb-4">{errors.fields}</p>
          )}

          {/* Fields List with Drag and Drop */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {formData.fields.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Type className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum campo adicionado
                </p>
                <p className="text-sm text-gray-400">
                  Clique em "Adicionar Campo" para começar
                </p>
              </div>
            ) : (
              formData.fields.map((field) => {
                const FieldIcon = getFieldIcon(field.type);
                const isExpanded = expandedField === field.id;

                return (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(field.id)}
                    onDragOver={(e) => handleDragOver(e, field.id)}
                    onDragEnd={handleDragEnd}
                    className={`border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-all ${
                      draggedField === field.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    {/* Field Header */}
                    <div className="flex items-center gap-3 p-3">
                      <div className="cursor-grab text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                        <FieldIcon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {field.label || 'Campo sem nome'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{field.name || 'sem_nome'}</span>
                          <span>•</span>
                          <span className="capitalize">{field.type}</span>
                          {field.required && (
                            <>
                              <span>•</span>
                              <span className="text-red-500">Obrigatório</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setExpandedField(isExpanded ? null : field.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateField(field)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Duplicar campo"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Remover campo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Field Details (Expanded) */}
                    {isExpanded && (
                      <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Label *
                            </label>
                            <Input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              placeholder="Ex: Título do Artigo"
                              error={errors[`field_${field.id}_label`]}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Nome (API) *
                            </label>
                            <Input
                              type="text"
                              value={field.name}
                              onChange={(e) =>
                                updateField(field.id, { name: e.target.value.toLowerCase() })
                              }
                              placeholder="Ex: title"
                              error={errors[`field_${field.id}_name`]}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Campo
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) =>
                              updateField(field.id, {
                                type: e.target.value as ContentField['type'],
                              })
                            }
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            {FIELD_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label} - {type.description}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descrição do Campo
                          </label>
                          <Input
                            type="text"
                            value={field.description || ''}
                            onChange={(e) =>
                              updateField(field.id, { description: e.target.value })
                            }
                            placeholder="Ajuda para o usuário preencher este campo"
                          />
                        </div>

                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                updateField(field.id, { required: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Obrigatório
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.unique}
                              onChange={(e) =>
                                updateField(field.id, { unique: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Valor Único
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Field Types Palette */}
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adicionar rapidamente:
            </p>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      const newField: ContentField = {
                        id: generateId(),
                        name: '',
                        type: type.value,
                        label: '',
                        required: false,
                        unique: false,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        fields: [...prev.fields, newField],
                      }));
                      setExpandedField(newField.id);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <TypeIcon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
                {isEditing ? 'Atualizar' : 'Criar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
