'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  Image,
  File,
  Film,
  FileAudio,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from '@/stores/toast.store';

interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], folder?: string, alt?: string) => Promise<void>;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  currentFolder?: string;
  folders?: { id: string; name: string; path: string }[];
}

const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_ACCEPTED_TYPES = ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.includes('pdf')) return FileText;
  return File;
}

export function MediaUploadModal({
  isOpen,
  onClose,
  onUpload,
  maxFiles = 10,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  currentFolder,
  folders = [],
}: MediaUploadModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState(currentFolder || '');
  const [altText, setAltText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFiles([]);
    setSelectedFolder(currentFolder || '');
    setAltText('');
    setIsDragging(false);
    setIsUploading(false);
  }, [currentFolder]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `Arquivo muito grande. Máximo: ${formatFileSize(maxFileSize)}`,
      };
    }
    return { valid: true };
  };

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const remainingSlots = maxFiles - files.length;

      if (fileArray.length > remainingSlots) {
        toast.warning(`Máximo de ${maxFiles} arquivos permitidos`);
      }

      const filesToAdd = fileArray.slice(0, remainingSlots).map((file) => {
        const validation = validateFile(file);
        const preview = file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined;

        return {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          progress: 0,
          status: validation.valid ? 'pending' : 'error',
          error: validation.error,
        } as MediaFile;
      });

      setFiles((prev) => [...prev, ...filesToAdd]);
    },
    [files.length, maxFiles, maxFileSize]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        addFiles(selectedFiles);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addFiles]
  );

  const handleUpload = async () => {
    const validFiles = files.filter((f) => f.status !== 'error').map((f) => f.file);

    if (validFiles.length === 0) {
      toast.error('Nenhum arquivo válido para upload');
      return;
    }

    setIsUploading(true);

    // Update status to uploading
    setFiles((prev) =>
      prev.map((f) => (f.status === 'pending' ? { ...f, status: 'uploading' as const } : f))
    );

    try {
      await onUpload(validFiles, selectedFolder || undefined, altText || undefined);

      // Update status to success
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, status: 'success' as const, progress: 100 } : f
        )
      );

      toast.success(`${validFiles.length} arquivo(s) enviado(s) com sucesso!`);

      // Close modal after short delay
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      // Update status to error
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'error' as const, error: error.message || 'Erro no upload' }
            : f
        )
      );
      toast.error(error.message || 'Erro ao enviar arquivos');
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Upload de Mídia"
      size="lg"
    >
      <div className="space-y-6">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          <Upload
            className={`w-12 h-12 mx-auto mb-4 ${
              isDragging ? 'text-blue-500' : 'text-gray-400'
            }`}
          />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
          </p>
          <p className="text-sm text-gray-500">
            Máximo {maxFiles} arquivos, até {formatFileSize(maxFileSize)} cada
          </p>
        </div>

        {/* Folder Selection */}
        {folders.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pasta de Destino
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Raiz</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.path}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Alt Text (for images) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Texto Alternativo (Alt)
          </label>
          <Input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Descrição da imagem para acessibilidade"
          />
          <p className="text-xs text-gray-500 mt-1">
            Aplicado a todas as imagens enviadas
          </p>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Arquivos ({files.length}/{maxFiles})
            </p>

            {files.map((mediaFile) => {
              const FileIcon = getFileIcon(mediaFile.file.type);
              return (
                <div
                  key={mediaFile.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    mediaFile.status === 'error'
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      : mediaFile.status === 'success'
                      ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  {/* Preview/Icon */}
                  {mediaFile.preview ? (
                    <img
                      src={mediaFile.preview}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                      <FileIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {mediaFile.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(mediaFile.file.size)}
                      {mediaFile.error && (
                        <span className="text-red-500 ml-2">{mediaFile.error}</span>
                      )}
                    </p>

                    {/* Progress Bar */}
                    {mediaFile.status === 'uploading' && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${mediaFile.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Status/Actions */}
                  <div className="flex items-center gap-2">
                    {mediaFile.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {mediaFile.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {mediaFile.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    {(mediaFile.status === 'pending' || mediaFile.status === 'error') && (
                      <button
                        type="button"
                        onClick={() => removeFile(mediaFile.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
          <div className="text-sm text-gray-500">
            {pendingCount > 0 && <span>{pendingCount} arquivo(s) pronto(s) para upload</span>}
            {errorCount > 0 && (
              <span className="text-red-500 ml-2">• {errorCount} com erro(s)</span>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || pendingCount === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar {pendingCount > 0 ? `(${pendingCount})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
