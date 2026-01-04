'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Save,
  Send,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  History,
  Tag,
  FolderOpen,
  Image,
  Link,
  Hash,
  ToggleLeft,
  Type,
  AlignLeft,
  Loader2,
  X,
  Plus,
  ChevronDown,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from '@/stores/toast.store';
import { ContentType, ContentField, ContentEntry } from '@/types';
import { entriesService, CreateEntryData, UpdateEntryData, EntryVersion, PublishOptions } from '@/services/entries.service';
import { categoriesService, Category } from '@/services/categories.service';
import { tagsService, Tag as TagType } from '@/services/tags.service';

export interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  entry?: ContentEntry | null;
  contentType: ContentType;
  contentTypes?: ContentType[]; // For relations
}

// Status configurations
const STATUS_CONFIG = {
  draft: { label: 'Rascunho', icon: FileText, color: 'text-gray-600 bg-gray-100' },
  scheduled: { label: 'Agendado', icon: Clock, color: 'text-blue-600 bg-blue-100' },
  published: { label: 'Publicado', icon: Eye, color: 'text-green-600 bg-green-100' },
  archived: { label: 'Arquivado', icon: Archive, color: 'text-yellow-600 bg-yellow-100' },
};

// Field type icons
const FIELD_ICONS: Record<string, typeof Type> = {
  text: Type,
  richtext: AlignLeft,
  number: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  media: Image,
  relation: Link,
  json: FileText,
};

export function EntryModal({ isOpen, onClose, onSave, entry, contentType, contentTypes = [] }: EntryModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'versions'>('content');
  
  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [customSlug, setCustomSlug] = useState(false);
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [data, setData] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Related data
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [versions, setVersions] = useState<EntryVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  
  const isEditing = !!entry;

  // Generate slug from title
  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }, []);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadTags();
      
      if (entry) {
        setTitle(entry.title);
        setSlug(entry.slug);
        setCustomSlug(true);
        setStatus(entry.status as 'draft' | 'scheduled' | 'published');
        setScheduledAt(entry.scheduledAt || '');
        setData(entry.data || {});
        // TODO: Load category and tags from entry
      } else {
        resetForm();
      }
    }
  }, [isOpen, entry]);

  // Auto-generate slug
  useEffect(() => {
    if (!customSlug && title) {
      setSlug(generateSlug(title));
    }
  }, [title, customSlug, generateSlug]);

  const loadCategories = async () => {
    try {
      const cats = await categoriesService.getCategories(contentType.id);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await tagsService.getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadVersions = async () => {
    if (!entry) return;
    setLoadingVersions(true);
    try {
      const v = await entriesService.getEntryVersions(entry.id);
      setVersions(v);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setCustomSlug(false);
    setStatus('draft');
    setScheduledAt('');
    setData({});
    setSelectedCategory('');
    setSelectedTags([]);
    setTagInput('');
    setActiveTab('content');
    setVersions([]);
  };

  // Field value handlers
  const handleFieldChange = (fieldName: string, value: any) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
  };

  // Validate required fields
  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return false;
    }

    // Check required fields
    for (const field of contentType.fields) {
      if (field.required && !data[field.name]) {
        toast.error(`O campo "${field.name}" é obrigatório`);
        return false;
      }
    }

    // Validate scheduled date
    if (status === 'scheduled' && !scheduledAt) {
      toast.error('Selecione uma data de agendamento');
      return false;
    }

    if (status === 'scheduled' && new Date(scheduledAt) <= new Date()) {
      toast.error('A data de agendamento deve ser no futuro');
      return false;
    }

    return true;
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const entryData: CreateEntryData | UpdateEntryData = {
        title,
        slug,
        status: 'draft',
        data,
        categoryId: selectedCategory || undefined,
        tags: selectedTags,
      };

      if (isEditing) {
        await entriesService.updateEntry(entry.id, entryData);
        toast.success('Rascunho salvo com sucesso');
      } else {
        await entriesService.createEntry({
          ...entryData,
          contentTypeId: contentType.id,
        } as CreateEntryData);
        toast.success('Entrada criada como rascunho');
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // Publish immediately
  const handlePublish = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      if (isEditing) {
        // Update and publish
        await entriesService.updateEntry(entry.id, {
          title,
          slug,
          data,
          categoryId: selectedCategory || undefined,
          tags: selectedTags,
        });
        await entriesService.publishEntry(entry.id, { publishImmediately: true });
      } else {
        // Create and publish
        const created = await entriesService.createEntry({
          contentTypeId: contentType.id,
          title,
          slug,
          status: 'published',
          data,
          categoryId: selectedCategory || undefined,
          tags: selectedTags,
        });
        await entriesService.publishEntry(created.id, { publishImmediately: true });
      }
      
      toast.success('Entrada publicada com sucesso');
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao publicar');
    } finally {
      setSaving(false);
    }
  };

  // Schedule for later
  const handleSchedule = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      if (isEditing) {
        await entriesService.updateEntry(entry.id, {
          title,
          slug,
          data,
          scheduledAt,
          categoryId: selectedCategory || undefined,
          tags: selectedTags,
        });
        await entriesService.scheduleEntry(entry.id, scheduledAt);
      } else {
        const created = await entriesService.createEntry({
          contentTypeId: contentType.id,
          title,
          slug,
          status: 'scheduled',
          data,
          scheduledAt,
          categoryId: selectedCategory || undefined,
          tags: selectedTags,
        });
        await entriesService.scheduleEntry(created.id, scheduledAt);
      }
      
      toast.success(`Publicação agendada para ${new Date(scheduledAt).toLocaleString('pt-BR')}`);
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao agendar');
    } finally {
      setSaving(false);
    }
  };

  // Restore version
  const handleRestoreVersion = async (versionNumber: number) => {
    if (!entry) return;
    
    setSaving(true);
    try {
      await entriesService.restoreEntryVersion(entry.id, versionNumber);
      toast.success(`Versão ${versionNumber} restaurada com sucesso`);
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao restaurar versão');
    } finally {
      setSaving(false);
    }
  };

  // Add tag
  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    
    const existingTag = availableTags.find(t => 
      t.name.toLowerCase() === tagInput.toLowerCase()
    );
    
    if (existingTag) {
      if (!selectedTags.includes(existingTag.id)) {
        setSelectedTags(prev => [...prev, existingTag.id]);
      }
    } else {
      try {
        const newTag = await tagsService.createTag({ name: tagInput });
        setAvailableTags(prev => [...prev, newTag]);
        setSelectedTags(prev => [...prev, newTag.id]);
      } catch (error) {
        toast.error('Erro ao criar tag');
      }
    }
    
    setTagInput('');
  };

  // Render field input based on type
  const renderField = (field: ContentField) => {
    const value = data[field.name] ?? field.defaultValue ?? '';
    const FieldIcon = FIELD_ICONS[field.type] || Type;

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Digite ${field.name.toLowerCase()}...`}
          />
        );

      case 'richtext':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Digite o conteúdo...`}
            rows={8}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y min-h-[200px]"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value ? Number(e.target.value) : '')}
            placeholder="0"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-brand-green-500 focus:ring-brand-green-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              {value ? 'Sim' : 'Não'}
            </span>
          </label>
        );

      case 'date':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case 'media':
        return (
          <div className="border-2 border-dashed dark:border-gray-600 rounded-lg p-6 text-center hover:border-brand-green-500 transition-colors cursor-pointer">
            <Image className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Clique para selecionar mídia</p>
            {value && (
              <p className="text-xs text-brand-green-600 mt-2">Mídia selecionada: {value}</p>
            )}
          </div>
        );

      case 'relation':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Selecione uma relação...</option>
            {/* TODO: Load related entries */}
          </select>
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                handleFieldChange(field.name, JSON.parse(e.target.value));
              } catch {
                handleFieldChange(field.name, e.target.value);
              }
            }}
            placeholder="{}"
            rows={6}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar: ${entry.title}` : `Nova Entrada: ${contentType.name}`}
      size="2xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-brand-green-500 text-brand-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Conteúdo
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-brand-green-500 text-brand-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FolderOpen className="w-4 h-4 inline-block mr-2" />
            Configurações
          </button>
          {isEditing && (
            <button
              onClick={() => {
                setActiveTab('versions');
                loadVersions();
              }}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'versions'
                  ? 'border-brand-green-500 text-brand-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <History className="w-4 h-4 inline-block mr-2" />
              Versões
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título..."
                  className="text-lg font-semibold"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setCustomSlug(true);
                    }}
                    placeholder="slug-do-conteudo"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSlug(generateSlug(title));
                      setCustomSlug(false);
                    }}
                  >
                    Gerar
                  </Button>
                </div>
              </div>

              {/* Dynamic Fields */}
              {contentType.fields.map((field) => (
                <div key={field.id}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {React.createElement(FIELD_ICONS[field.type] || Type, { className: 'w-4 h-4' })}
                    {field.name}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FolderOpen className="w-4 h-4 inline-block mr-2" />
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline-block mr-2" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTags.map((tagId) => {
                    const tag = availableTags.find(t => t.id === tagId);
                    return tag ? (
                      <span
                        key={tagId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-700 dark:text-brand-green-400 rounded-full text-sm"
                      >
                        {tag.name}
                        <button
                          onClick={() => setSelectedTags(prev => prev.filter(t => t !== tagId))}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Adicionar tag..."
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline-block mr-2" />
                  Agendar Publicação
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {scheduledAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    Será publicado em: {new Date(scheduledAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
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
                versions.map((version) => (
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
                          Por {version.changedBy.name} em {new Date(version.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreVersion(version.versionNumber)}
                        disabled={saving}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restaurar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Rascunho
            </Button>

            {scheduledAt ? (
              <Button onClick={handleSchedule} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                Agendar
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Publicar Agora
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default EntryModal;
