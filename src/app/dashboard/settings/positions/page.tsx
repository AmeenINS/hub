'use client';

import * as React from 'react';
import { useI18n } from '@/shared/i18n/i18n-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Position } from '@/shared/types/database';

export default function PositionsPage() {
  const { t } = useI18n();
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPosition, setEditingPosition] = React.useState<Position | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    nameAr: '',
    description: '',
    level: 1,
  });

  // Fetch positions
  const fetchPositions = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/positions');
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositions(data);
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPosition
        ? `/api/positions/${editingPosition.id}`
        : '/api/positions';
      const method = editingPosition ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save position');

      toast.success(
        editingPosition
          ? t('settings.positionUpdated')
          : t('settings.positionCreated')
      );
      setIsDialogOpen(false);
      resetForm();
      fetchPositions();
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('settings.confirmDeletePosition'))) return;

    try {
      const response = await fetch(`/api/positions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete position');

      toast.success(t('settings.positionDeleted'));
      fetchPositions();
    } catch (error) {
      console.error('Error deleting position:', error);
      toast.error(t('common.error'));
    }
  };

  const openEditDialog = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      nameAr: position.nameAr || '',
      description: position.description || '',
      level: position.level,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPosition(null);
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      level: 1,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('settings.positions')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('settings.positionsDescription')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              {t('settings.addPosition')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingPosition
                    ? t('settings.editPosition')
                    : t('settings.addPosition')}
                </DialogTitle>
                <DialogDescription>
                  {t('settings.positionFormDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('settings.positionName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">{t('settings.positionNameAr') || 'Position Name (Arabic)'}</Label>
                  <Input
                    id="nameAr"
                    dir="rtl"
                    value={formData.nameAr}
                    onChange={(e) =>
                      setFormData({ ...formData, nameAr: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">{t('settings.positionLevel')}</Label>
                  <Input
                    id="level"
                    type="number"
                    min="1"
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('settings.positionDescription')}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit">{t('common.save')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.positionsList')}</CardTitle>
          <CardDescription>{t('settings.positionsListDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('settings.noPositions')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('settings.positionName')}</TableHead>
                  <TableHead>{t('settings.positionLevel')}</TableHead>
                  <TableHead>{t('settings.positionDescription')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions
                  .sort((a, b) => a.level - b.level)
                  .map((position) => (
                    <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      <div>{position.name}</div>
                      {position.nameAr && (
                        <div className="text-xs text-muted-foreground">
                          {position.nameAr}
                        </div>
                      )}
                    </TableCell>
                      <TableCell>
                        <Badge variant="outline">{position.level}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {position.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={position.isActive ? 'default' : 'secondary'}>
                          {position.isActive ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(position)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(position.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
