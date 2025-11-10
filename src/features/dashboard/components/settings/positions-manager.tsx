'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { useI18n } from '@/shared/i18n/i18n-context';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { toast } from 'sonner';
import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react';
import { Position, PositionFormState } from './types';
import { Spinner } from '@/shared/components/ui/spinner';

interface PositionsManagerProps {
  canView: boolean;
  canManage: boolean;
}

const defaultFormState: PositionFormState = {
  name: '',
  nameAr: '',
  description: '',
  level: 1,
  isActive: true,
};

export function PositionsManager({ canView, canManage }: PositionsManagerProps) {
  const { t } = useI18n();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formState, setFormState] = useState<PositionFormState>(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);

  const sortedPositions = useMemo(
    () => positions.slice().sort((a, b) => a.level - b.level),
    [positions]
  );

  const fetchPositions = useCallback(async () => {
    if (!canView) {
      setPositions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get<Position[]>('/api/positions');
      if (response.success && response.data) {
        setPositions(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.fetchError')));
    } finally {
      setLoading(false);
    }
  }, [canView, t]);

  useEffect(() => {
    void fetchPositions();
  }, [fetchPositions]);

  const resetDialogState = () => {
    setDialogOpen(false);
    setEditingPosition(null);
    setFormState(defaultFormState);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetDialogState();
    } else {
      setDialogOpen(true);
    }
  };

  const handleOpenDialog = (position?: Position) => {
    if (!canManage) {
      toast.error(t('settings.permissionDenied'));
      return;
    }

    if (position) {
      setEditingPosition(position);
      setFormState({
        name: position.name,
        nameAr: position.nameAr || '',
        description: position.description || '',
        level: position.level,
        isActive: position.isActive,
      });
    } else {
      setEditingPosition(null);
      setFormState(defaultFormState);
    }
    setDialogOpen(true);
  };

  const handleSavePosition = async () => {
    if (!formState.name.trim() || !formState.nameAr.trim()) {
      toast.error(t('settings.positionNameRequired'));
      return;
    }

    try {
      setSaving(true);
      const url = editingPosition ? `/api/positions/${editingPosition.id}` : '/api/positions';
      const response = editingPosition
        ? await apiClient.put(url, formState)
        : await apiClient.post(url, formState);

      if (response.success) {
        toast.success(
          editingPosition ? t('settings.positionUpdated') : t('settings.positionCreated')
        );
        resetDialogState();
        void fetchPositions();
      } else {
        toast.error(response.message || t('messages.updateError'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.updateError')));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePosition = (position: Position) => {
    if (!canManage) {
      toast.error(t('settings.permissionDenied'));
      return;
    }
    setPositionToDelete(position);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!positionToDelete) {
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.delete(`/api/positions/${positionToDelete.id}`);
      if (response.success) {
        toast.success(t('settings.positionDeleted'));
        setDeleteDialogOpen(false);
        setPositionToDelete(null);
        void fetchPositions();
      } else {
        toast.error(response.message || t('messages.deleteError'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.deleteError')));
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.positions')}</CardTitle>
          <CardDescription>{t('settings.positionsManagement')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('settings.permissionDenied')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t('settings.positions')}</CardTitle>
              <CardDescription>{t('settings.positionsManagement')}</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} disabled={!canManage}>
              <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('settings.addPosition')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-10 w-10" />
            </div>
          ) : sortedPositions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground space-y-3">
              <Briefcase className="mx-auto h-12 w-12" />
              <p>{t('settings.noPositions')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('settings.positionName')}</TableHead>
                  <TableHead>{t('settings.positionDescription')}</TableHead>
                  <TableHead>{t('settings.positionLevel')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPositions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      <div>{position.name}</div>
                      {position.nameAr && (
                        <div className="text-xs text-muted-foreground">{position.nameAr}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {position.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t('settings.level')} {position.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={position.isActive ? 'default' : 'secondary'}>
                        {position.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(position)}
                          disabled={!canManage}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePosition(position)}
                          disabled={!canManage}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? t('settings.editPosition') : t('settings.addPosition')}
            </DialogTitle>
            <DialogDescription>
              {editingPosition
                ? t('settings.editPositionDescription')
                : t('settings.addPositionDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position-name">{t('settings.positionName')}</Label>
              <Input
                id="position-name"
                value={formState.name}
                onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                placeholder={t('settings.positionNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-name-ar">
                {t('settings.positionNameAr') || 'Position Name (Arabic)'}
              </Label>
              <Input
                id="position-name-ar"
                dir="rtl"
                value={formState.nameAr}
                onChange={(event) => setFormState({ ...formState, nameAr: event.target.value })}
                placeholder={t('settings.positionNameArPlaceholder') || 'مثال: المدير التنفيذي'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-description">{t('settings.positionDescription')}</Label>
              <Textarea
                id="position-description"
                rows={3}
                value={formState.description}
                onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                placeholder={t('settings.positionDescriptionPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-level">{t('settings.positionLevel')}</Label>
              <Input
                id="position-level"
                type="number"
                min={1}
                value={formState.level}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    level: Number.parseInt(event.target.value || '1', 10),
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="position-active">{t('common.active')}</Label>
              <Switch
                id="position-active"
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState({ ...formState, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDialogState}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSavePosition} disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t('common.confirmation')}
        description={t('settings.deletePositionConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="error"
        isLoading={saving}
      />
    </>
  );
}
