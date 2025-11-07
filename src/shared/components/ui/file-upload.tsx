'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Upload, X, File, FileText, FileImage, FileVideo, Loader2 } from 'lucide-react';
import { cn } from '@/core/utils';

export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

interface FileUploadProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  entityType?: string;
  entityId?: string;
  allowedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  accept?: string;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  entityType,
  entityId,
  allowedTypes,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  accept,
  className,
  disabled = false,
  showPreview = true
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-8 w-8" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="h-8 w-8" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="h-8 w-8" />;
    }
    return <File className="h-8 w-8" />;
  };

  const uploadFile = async (file: File) => {
    if (disabled) return;

    // Validate file size
    if (file.size > maxSize) {
      const error = `File too large. Maximum size is ${formatFileSize(maxSize)}`;
      onUploadError?.(error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (entityType) formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);
      if (allowedTypes) formData.append('allowedTypes', JSON.stringify(allowedTypes));
      formData.append('maxSize', String(maxSize));

      // Simulate progress (since we can't track real progress with fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      const uploadedFile = data.file as UploadedFile;

      setUploadedFiles(prev => [...prev, uploadedFile]);
      onUploadComplete?.(uploadedFile);

      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;

    if (multiple) {
      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i]);
      }
    } else {
      await uploadFile(files[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiple, disabled]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = async (fileId: string) => {
    try {
      const response = await fetch(`/api/upload?id=${fileId}`, {
        method: 'DELETE',
        credentials: 'include' // Include cookies
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'relative border-2 border-dashed transition-colors',
          dragActive && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-primary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Uploading... {uploadProgress}%
              </p>
              <div className="w-full max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` } as React.CSSProperties}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: {formatFileSize(maxSize)}
              </p>
              {accept && (
                <p className="text-xs text-muted-foreground mt-1">
                  Allowed types: {accept}
                </p>
              )}
            </>
          )}
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        aria-label="File upload input"
        title="Upload file"
      />

      {/* Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files</p>
          <div className="grid grid-cols-1 gap-2">
            {uploadedFiles.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(file.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
