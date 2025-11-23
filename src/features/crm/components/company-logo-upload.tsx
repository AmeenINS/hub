'use client';

import { useState } from 'react';
import { ImageUpload } from '@/shared/components/ui/image-upload';
import { UploadedFile } from '@/shared/components/ui/file-upload';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';

interface CompanyLogoUploadProps {
  companyId?: string;
  currentLogoUrl?: string;
  companyName?: string;
  onLogoChange?: (logoUrl: string) => void;
  variant?: 'card' | 'inline';
}

export function CompanyLogoUpload({
  companyId,
  currentLogoUrl,
  companyName,
  onLogoChange,
  variant = 'card'
}: CompanyLogoUploadProps) {
  const { t } = useI18n();
  const [logoUrl, setLogoUrl] = useState<string | undefined>(currentLogoUrl);
  const [uploading, setUploading] = useState(false);

  const handleUploadComplete = async (file: UploadedFile) => {
    setUploading(true);
    try {
      // If we have a companyId (editing mode), update the company record
      if (companyId) {
        const response = await apiClient.patch(`/api/crm/companies/${companyId}`, {
          logoUrl: file.fileUrl
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to update company logo');
        }
      }

      const newLogoUrl = file.fileUrl;
      const logoUrlWithCache = `${newLogoUrl}?t=${Date.now()}`;
      
      setLogoUrl(logoUrlWithCache);
      onLogoChange?.(newLogoUrl);
      
      console.log('Company logo updated:', { fileUrl: file.fileUrl, logoUrl: newLogoUrl });
      toast.success('Company logo updated successfully');
    } catch (error) {
      console.error('Error updating company logo:', error);
      toast.error(getErrorMessage(error, 'Failed to update company logo'));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const getInitials = () => {
    if (!companyName) return 'C';
    const parts = companyName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={logoUrl} alt={companyName || 'Company'} />
          <AvatarFallback className="text-xl bg-primary/10">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <ImageUpload
          entityType="company"
          entityId={companyId || 'new'}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          variant="avatar"
          disabled={uploading}
          currentImageUrl={logoUrl}
          size="sm"
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>{t('crm.companyLogo')}</span>
        </CardTitle>
        <CardDescription>
          {t('crm.uploadCompanyLogo')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={logoUrl} alt={companyName || 'Company'} />
            <AvatarFallback className="text-lg bg-primary/10">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{companyName || 'Company'}</p>
            {logoUrl ? (
              <p className="text-xs text-muted-foreground">{t('crm.logoUploaded')}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t('crm.noLogoUploaded')}</p>
            )}
          </div>
        </div>
        <ImageUpload
          entityType="company"
          entityId={companyId || 'new'}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          variant="card"
          disabled={uploading}
          currentImageUrl={logoUrl}
          size="sm"
        />
      </CardContent>
    </Card>
  );
}
