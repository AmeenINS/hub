'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import { UploadedFile } from '@/components/ui/file-upload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { apiClient, getErrorMessage } from '@/lib/api-client';

interface ContactAvatarUploadProps {
  contactId?: string;
  currentAvatarUrl?: string;
  contactName?: string;
  onAvatarChange?: (avatarUrl: string) => void;
  variant?: 'card' | 'inline';
}

export function ContactAvatarUpload({
  contactId,
  currentAvatarUrl,
  contactName,
  onAvatarChange,
  variant = 'card'
}: ContactAvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);

  const handleUploadComplete = async (file: UploadedFile) => {
    setUploading(true);
    try {
      // If we have a contactId (editing mode), update the contact record
      if (contactId) {
        const response = await apiClient.patch(`/api/crm/contacts/${contactId}`, {
          avatarUrl: file.fileUrl
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to update contact avatar');
        }
      }

      const newAvatarUrl = file.fileUrl;
      const avatarUrlWithCache = `${newAvatarUrl}?t=${Date.now()}`;
      
      setAvatarUrl(avatarUrlWithCache);
      onAvatarChange?.(newAvatarUrl);
      
      console.log('Contact avatar updated:', { fileUrl: file.fileUrl, avatarUrl: newAvatarUrl });
      toast.success('Contact avatar updated successfully');
    } catch (error) {
      console.error('Error updating contact avatar:', error);
      toast.error(getErrorMessage(error, 'Failed to update contact avatar'));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const getInitials = () => {
    if (!contactName) return 'C';
    const parts = contactName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return contactName[0].toUpperCase();
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={contactName || 'Contact'} />
          <AvatarFallback className="text-xl bg-primary/10">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <ImageUpload
          entityType="contact"
          entityId={contactId || 'new'}
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
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Contact Photo</span>
        </CardTitle>
        <CardDescription>
          Upload a photo for this contact. Recommended size: 400x400px
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={contactName || 'Contact'} />
            <AvatarFallback className="text-lg bg-primary/10">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{contactName || 'Contact'}</p>
            {avatarUrl ? (
              <p className="text-xs text-muted-foreground">Photo uploaded</p>
            ) : (
              <p className="text-xs text-muted-foreground">No photo uploaded</p>
            )}
          </div>
        </div>
        <ImageUpload
          entityType="contact"
          entityId={contactId || 'new'}
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
