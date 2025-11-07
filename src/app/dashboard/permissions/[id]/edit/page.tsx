'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useAuthStore } from '@/shared/state/auth-store';
import { RTLChevron } from '@/shared/components/ui/rtl-icon';

const permissionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
});

const categories = [
  'users',
  'tasks', 
  'roles',
  'permissions',
  'reports',
  'departments',
  'system'
];

export default function EditPermissionPage() {
  const { t } = useI18n();
  const { token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const permissionId = params.id as string;
  
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    category: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchPermission = async () => {
      try {
        const response = await fetch(`/api/permissions/${permissionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setFormData({
              name: data.data.name,
              description: data.data.description,
              category: data.data.category,
            });
          } else {
            toast.error(t('permissions.fetchError'));
            router.push('/dashboard/permissions');
          }
        } else {
          toast.error(t('permissions.fetchError'));
          router.push('/dashboard/permissions');
        }
      } catch (error) {
        console.error('Failed to fetch permission:', error);
        toast.error(t('permissions.fetchError'));
        router.push('/dashboard/permissions');
      } finally {
        setInitialLoading(false);
      }
    };

    if (permissionId) {
      fetchPermission();
    }
  }, [permissionId, token, t, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = permissionSchema.parse(formData);
      setErrors({});
      setLoading(true);

      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        toast.success(t('permissions.updateSuccess'));
        router.push('/dashboard/permissions');
      } else {
        const data = await response.json();
        toast.error(data.message || t('permissions.updateError'));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Failed to update permission:', error);
        toast.error(t('permissions.updateError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <RTLChevron>
            <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          </RTLChevron>
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('permissions.edit')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('permissions.editDescription')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('permissions.details')}</CardTitle>
          <CardDescription>
            {t('permissions.formDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('permissions.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('permissions.namePlaceholder')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('permissions.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('permissions.descriptionPlaceholder')}
                className={errors.description ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">{t('permissions.category')}</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('permissions.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(`permissions.categories.${category}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('common.saving') : t('common.save')}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}