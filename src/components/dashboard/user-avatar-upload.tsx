'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import { UploadedFile } from '@/components/ui/file-upload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';

interface UserAvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string;
  userFullName?: string;
  onAvatarUpdated?: (avatarUrl: string) => void;
  showPreview?: boolean;
  variant?: 'card' | 'avatar';
}

export function UserAvatarUpload({
  userId,
  currentAvatarUrl,
  userFullName,
  onAvatarUpdated,
  showPreview = true,
  variant = 'card'
}: UserAvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);

  const handleUploadComplete = async (file: UploadedFile) => {
    setUploading(true);
    try {
      // Update user record with new avatar URL using apiClient
      const response = await apiClient.patch<{ avatarUrl: string }>(`/api/users/${userId}`, {
        avatarUrl: file.fileUrl
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update avatar');
      }

      const newAvatarUrl = response.data.avatarUrl || file.fileUrl;
      
      // Add cache buster to force reload
      const avatarUrlWithCache = `${newAvatarUrl}?t=${Date.now()}`;
      
      setAvatarUrl(avatarUrlWithCache);
      onAvatarUpdated?.(newAvatarUrl);
      
      console.log('Avatar updated:', { fileUrl: file.fileUrl, avatarUrl: newAvatarUrl });
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error updating user avatar:', error);
      toast.error(getErrorMessage(error, 'Failed to update avatar'));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const getInitials = () => {
    if (!userFullName) return 'U';
    const parts = userFullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return userFullName[0].toUpperCase();
  };

  if (variant === 'avatar') {
    return (
      <div className="flex flex-col items-center gap-4">
        {showPreview && (
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={userFullName || 'User'} />
            <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
          </Avatar>
        )}
        <ImageUpload
          entityType="user"
          entityId={userId}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          variant="avatar"
          disabled={uploading}
          currentImageUrl={avatarUrl}
          size="sm"
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Upload a profile picture. Recommended size: 400x400px
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPreview && (
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} alt={userFullName || 'User'} />
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{userFullName || 'User'}</p>
              {avatarUrl ? (
                <p className="text-xs text-muted-foreground">Avatar uploaded</p>
              ) : (
                <p className="text-xs text-muted-foreground">No avatar uploaded</p>
              )}
            </div>
          </div>
        )}
        <ImageUpload
          entityType="user"
          entityId={userId}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          variant="card"
          disabled={uploading}
          currentImageUrl={avatarUrl}
          size="sm"
        />
      </CardContent>
    </Card>
  );
}
