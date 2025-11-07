'use client';

import { useState, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Upload, X, Loader2, User } from 'lucide-react';
import { cn } from '@/core/utils';
import Image from 'next/image';

export interface UploadedImage {
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

interface ImageUploadProps {
  onUploadComplete?: (image: UploadedImage) => void;
  onUploadError?: (error: string) => void;
  entityType?: string;
  entityId?: string;
  currentImageUrl?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  variant?: 'avatar' | 'card' | 'banner';
  shape?: 'circle' | 'square' | 'rounded';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRemoveButton?: boolean;
  fallbackText?: string;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
  xl: 'h-48 w-48'
};

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  entityType,
  entityId,
  currentImageUrl,
  maxSize = 5 * 1024 * 1024, // 5MB for images
  className,
  disabled = false,
  variant = 'card',
  shape = 'rounded',
  size = 'md',
  showRemoveButton = true,
  fallbackText
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadImage = async (file: File) => {
    if (disabled) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError?.('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      const error = `Image too large. Maximum size is ${formatFileSize(maxSize)}`;
      onUploadError?.(error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);
      
      if (entityType) formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);
      formData.append('allowedTypes', JSON.stringify(['image/*']));
      formData.append('maxSize', String(maxSize));

      // Simulate progress
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
      const uploadedImage = data.file as UploadedImage;

      setPreviewUrl(uploadedImage.fileUrl);
      onUploadComplete?.(uploadedImage);

      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
      setPreviewUrl(currentImageUrl || null);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadImage(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Avatar variant
  if (variant === 'avatar') {
    return (
      <div className={cn('relative inline-block', className)}>
        <Avatar className={cn(sizeClasses[size], shape === 'circle' ? 'rounded-full' : 'rounded-md')}>
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Avatar" />
          ) : (
            <AvatarFallback>
              {fallbackText || <User className="h-1/2 w-1/2" />}
            </AvatarFallback>
          )}
        </Avatar>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <Upload className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept="image/*"
          disabled={disabled}
          aria-label="Upload image file"
          title="Upload image"
        />
      </div>
    );
  }

  // Card variant
  return (
    <div className={cn('space-y-2', className)}>
      <Card
        className={cn(
          'relative overflow-hidden',
          !previewUrl && 'border-2 border-dashed',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-primary/50'
        )}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <div className="relative aspect-video w-full max-w-sm mx-auto">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover rounded-md"
              unoptimized
            />
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                <p className="text-sm text-white">{uploadProgress}%</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
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
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">
                  Click to upload image
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum size: {formatFileSize(maxSize)}
                </p>
              </>
            )}
          </div>
        )}
      </Card>

      {previewUrl && showRemoveButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleRemove}
          disabled={disabled || uploading}
        >
          <X className="h-4 w-4 mr-2" />
          Remove Image
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        accept="image/*"
        disabled={disabled}
        aria-label="Upload image file"
        title="Upload image"
      />
    </div>
  );
}
