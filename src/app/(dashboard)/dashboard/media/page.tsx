'use client';

import React from 'react';
import {
  Upload,
  Search,
  Grid,
  List,
  MoreVertical,
  Download,
  Trash2,
  Image as ImageIcon,
  File,
  Video,
  Music,
  X,
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
import { mediaService } from '@/services/media.service';
import type { MediaFile } from '@/types';
import { formatDate, formatFileSize, cn } from '@/lib/utils';
import { toast } from '@/stores/toast.store';

export default function MediaPage() {
  const [files, setFiles] = React.useState<MediaFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<MediaFile | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const data = await mediaService.getMediaFiles({ page: 1, perPage: 50 });
      setFiles(data.items);
    } catch (error) {
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    try {
      for (const file of Array.from(fileList)) {
        await mediaService.uploadMedia(file, 'uploads');
      }
      toast.success('Upload realizado com sucesso!');
      setUploadModalOpen(false);
      fetchFiles();
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
  };

  const handleDelete = async (file: MediaFile) => {
    try {
      await mediaService.deleteMediaFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast.success('Arquivo excluído');
      setSelectedFile(null);
    } catch (error) {
      toast.error('Erro ao excluir arquivo');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image')) return ImageIcon;
    if (type.startsWith('video')) return Video;
    if (type.startsWith('audio')) return Music;
    return File;
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biblioteca de Mídia</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie imagens, vídeos e arquivos do seu projeto.</p>
        </div>
        <Button variant="primary" onClick={() => setUploadModalOpen(true)}>
          <Upload className="w-5 h-5 mr-2" />
          Upload
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <Input
                placeholder="Buscar arquivos..."
                leftIcon={<Search className="w-5 h-5" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid'
                    ? 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list'
                    ? 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.mimeType);
            return (
              <Card
                key={file.id}
                className="cursor-pointer hover:ring-2 hover:ring-brand-green-500 transition-all"
                onClick={() => setSelectedFile(file)}
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
                  {file.mimeType.startsWith('image') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Arquivo
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Tipo
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Tamanho
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Data
                  </th>
                  <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 px-6 py-4">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.mimeType);
                  return (
                    <tr
                      key={file.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setSelectedFile(file)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                            {file.mimeType.startsWith('image') ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{file.mimeType}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(file.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum arquivo encontrado</p>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload de Arquivos"
      >
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
            dragging
              ? 'border-brand-green-500 bg-brand-green-50 dark:bg-brand-green-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Arraste arquivos aqui ou{' '}
            <button
              className="text-brand-green-600 font-medium hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              selecione do computador
            </button>
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">PNG, JPG, GIF, PDF até 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </Modal>

      {/* File Preview Modal */}
      <Modal
        open={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        title={selectedFile?.name || 'Detalhes do arquivo'}
      >
        {selectedFile && (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              {selectedFile.mimeType.startsWith('image') ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {React.createElement(getFileIcon(selectedFile.mimeType), {
                    className: 'w-16 h-16 text-gray-400',
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tamanho:</span>
                <span className="text-gray-900 dark:text-white">{formatFileSize(selectedFile.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                <span className="text-gray-900 dark:text-white">{selectedFile.mimeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Criado em:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(selectedFile.createdAt)}</span>
              </div>
              {selectedFile.width && selectedFile.height && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Dimensões:</span>
                  <span className="text-gray-900 dark:text-white">
                    {selectedFile.width} x {selectedFile.height}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(selectedFile)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
