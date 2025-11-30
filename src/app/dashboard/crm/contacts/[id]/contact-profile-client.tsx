/**
 * Contact Profile Client Component
 * Interactive profile view with tabs for different information sections
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Contact, Company, ContactNote } from '@/shared/types/database';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useToast } from '@/shared/hooks/use-toast';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { apiClient, getErrorMessage } from '@/core/api/client';
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  User as UserIcon,
  Edit,
  Trash2,
  ArrowLeft,
  Briefcase,
  Clock,
  Tag,
  FileText,
  Activity,
  MessageSquare,
  Users,
  CheckCircle2,
  Plus,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';

interface ContactProfileClientProps {
  contact: Contact;
  company: Company | null;
  companies: Company[];
}

const getContactTypeColor = (type: string) => {
  switch (type) {
    case 'CUSTOMER':
      return 'bg-green-500/10 text-green-700 dark:text-green-400';
    case 'LEAD':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    case 'PARTNER':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
    case 'SUPPLIER':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  }
};

export default function ContactProfileClient({
  contact,
  company,
}: ContactProfileClientProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Notes state
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [deleteNoteDialogOpen, setDeleteNoteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<ContactNote | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  const loadNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const response = await apiClient.get<ContactNote[]>(
        `/api/crm/contacts/${contact.id}/notes`
      );
      if (response.success && response.data) {
        setNotes(response.data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Load notes when component mounts
  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast({
        title: t('common.error'),
        description: t('crm.noteContent'),
        variant: 'destructive',
      });
      return;
    }

    setIsSavingNote(true);
    try {
      const response = await apiClient.post<ContactNote>(
        `/api/crm/contacts/${contact.id}/notes`,
        { content: newNoteContent }
      );

      if (response.success && response.data) {
        setNotes([response.data, ...notes]);
        setNewNoteContent('');
        setIsAddingNote(false);
        toast({
          title: t('messages.success'),
          description: t('crm.noteCreated'),
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorMessage(error, t('crm.failedToCreateNote')),
        variant: 'destructive',
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editNoteContent.trim()) {
      toast({
        title: t('common.error'),
        description: t('crm.noteContent'),
        variant: 'destructive',
      });
      return;
    }

    setIsSavingNote(true);
    try {
      const response = await apiClient.put<ContactNote>(
        `/api/crm/contacts/${contact.id}/notes/${noteId}`,
        { content: editNoteContent }
      );

      if (response.success && response.data) {
        setNotes(notes.map(n => n.id === noteId ? response.data! : n));
        setEditingNoteId(null);
        setEditNoteContent('');
        toast({
          title: t('messages.success'),
          description: t('crm.noteUpdated'),
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorMessage(error, t('crm.failedToUpdateNote')),
        variant: 'destructive',
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    setIsDeletingNote(true);
    try {
      const response = await apiClient.delete(
        `/api/crm/contacts/${contact.id}/notes/${noteToDelete.id}`
      );

      if (response.success) {
        setNotes(notes.filter(n => n.id !== noteToDelete.id));
        setDeleteNoteDialogOpen(false);
        setNoteToDelete(null);
        toast({
          title: t('messages.success'),
          description: t('crm.noteDeleted'),
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorMessage(error, t('crm.failedToDeleteNote')),
        variant: 'destructive',
      });
    } finally {
      setIsDeletingNote(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = Cookies.get('auth-token');
      if (!token) {
        toast({
          title: t('common.error'),
          description: t('crm.unauthorized'),
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: t('messages.success'),
          description: t('crm.contactDeleted'),
        });
        router.push('/dashboard/crm/contacts');
      } else {
        throw new Error('Failed to delete contact');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t('common.error'),
        description: t('crm.failedToDelete'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const displayNameEn =
    contact.fullNameEn ||
    [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
  const displayNameAr = contact.fullNameAr || '';
  const fallbackName = displayNameEn || displayNameAr || contact.email || contact.phone || '';
  const initials =
    fallbackName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';
  const primaryName = displayNameEn || displayNameAr || '';
  const secondaryName = displayNameAr && displayNameAr !== primaryName ? displayNameAr : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('crm.contactProfile')}</h1>
            <p className="text-muted-foreground">{t('crm.viewContactDetails')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/crm/contacts/${contact.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24">
              {contact.avatarUrl && (
                <AvatarImage src={contact.avatarUrl} alt={contact.fullNameEn || contact.fullNameAr || ''} />
              )}
              <AvatarFallback className="text-2xl font-semibold">{initials}</AvatarFallback>
            </Avatar>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-bold">
                      {primaryName || t('crm.contactProfile')}
                    </h2>
                    {secondaryName && (
                      <span className="text-base text-muted-foreground">{secondaryName}</span>
                    )}
                  </div>
                  <Badge className={getContactTypeColor(contact.type)}>{contact.type}</Badge>
                </div>
                {contact.jobTitle && (
                  <p className="text-lg text-muted-foreground">
                    {contact.jobTitle}
                    {contact.department && ` • ${contact.department}`}
                  </p>
                )}
              </div>

              {/* Contact Methods */}
              <div className="flex flex-wrap gap-4">
                {contact.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${contact.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      {contact.email}
                    </a>
                  </Button>
                )}
                {contact.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${contact.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      {contact.phone}
                    </a>
                  </Button>
                )}
                {company && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/crm/companies/${company.id}`}>
                      <Building2 className="h-4 w-4 mr-2" />
                      {company.name}
                    </Link>
                  </Button>
                )}
              </div>

              {/* Preferred Contact Method */}
              {contact.preferredContactMethod && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t('crm.preferredContactMethod')}:
                  </span>
                  <Badge variant="secondary">{contact.preferredContactMethod}</Badge>
                </div>
              )}

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview">
            <UserIcon className="h-4 w-4 mr-2" />
            {t('crm.overview')}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            {t('crm.activity')}
          </TabsTrigger>
          <TabsTrigger value="notes">
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('crm.notes')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  {t('crm.contactInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {contact.email && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{t('crm.email')}</span>
                      </div>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{t('crm.phone')}</span>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.preferredContactMethod && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{t('crm.preferredMethod')}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {contact.preferredContactMethod}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t('crm.companyInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{t('crm.company')}</span>
                      </div>
                      <Link
                        href={`/dashboard/crm/companies/${company.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {company.name}
                      </Link>
                    </div>
                    {contact.jobTitle && (
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{t('crm.position')}</span>
                        </div>
                        <span className="text-sm font-medium">{contact.jobTitle}</span>
                      </div>
                    )}
                    {contact.department && (
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{t('crm.department')}</span>
                        </div>
                        <span className="text-sm font-medium">{contact.department}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('crm.noCompanyLinked')}</p>
                )}
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('crm.addressInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contact.address || contact.city || contact.state || contact.country ? (
                  <div className="space-y-2">
                    {contact.address && (
                      <p className="text-sm font-medium">{contact.address}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {[contact.city, contact.state, contact.zipCode, contact.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('crm.noAddressProvided')}</p>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t('crm.metadata')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{t('crm.createdAt')}</span>
                    </div>
                    <span className="text-sm font-medium">{formatDate(contact.createdAt)}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{t('crm.updatedAt')}</span>
                    </div>
                    <span className="text-sm font-medium">{formatDate(contact.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('crm.recentActivity')}
              </CardTitle>
              <CardDescription>{t('crm.activityHistory')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Activity Timeline - Placeholder */}
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('crm.contactCreated')}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(contact.createdAt)}
                    </p>
                  </div>
                </div>

                {contact.updatedAt !== contact.createdAt && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                      <Edit className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t('crm.contactUpdated')}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(contact.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{t('crm.noAdditionalActivity')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t('crm.notes')} ({notes.length})
                </div>
                {!isAddingNote && (
                  <Button onClick={() => setIsAddingNote(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('crm.addNote')}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>{t('crm.internalNotes')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note Form */}
              {isAddingNote && (
                <Card className="border-2 border-primary">
                  <CardContent className="pt-4 space-y-3">
                    <Textarea
                      placeholder={t('crm.writeNote')}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingNote(false);
                          setNewNoteContent('');
                        }}
                        disabled={isSavingNote}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {t('crm.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={isSavingNote || !newNoteContent.trim()}
                      >
                        {isSavingNote ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {t('crm.saveNote')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes List */}
              {isLoadingNotes ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <h3 className="font-semibold text-lg mb-1">{t('crm.noNotes')}</h3>
                  <p className="text-sm">{t('crm.startAddingNotes')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <Card key={note.id} className="border">
                      <CardContent className="pt-4">
                        {editingNoteId === note.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editNoteContent}
                              onChange={(e) => setEditNoteContent(e.target.value)}
                              rows={4}
                              className="resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditNoteContent('');
                                }}
                                disabled={isSavingNote}
                              >
                                <X className="h-4 w-4 mr-2" />
                                {t('crm.cancel')}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleEditNote(note.id)}
                                disabled={isSavingNote || !editNoteContent.trim()}
                              >
                                {isSavingNote ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 mr-2" />
                                )}
                                {t('crm.saveNote')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <UserIcon className="h-4 w-4" />
                                <span>{t('crm.noteBy')}</span>
                                <span className="font-medium">{note.createdByName || note.createdBy}</span>
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(note.createdAt)}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditNoteContent(note.content);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setNoteToDelete(note);
                                    setDeleteNoteDialogOpen(true);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            {note.updatedAt !== note.createdAt && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {t('crm.updatedAt')}: {formatDate(note.updatedAt)}
                              </p>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Note Confirmation Dialog */}
      <ConfirmDialog
        open={deleteNoteDialogOpen}
        onOpenChange={setDeleteNoteDialogOpen}
        onConfirm={handleDeleteNote}
        title={t('crm.deleteNoteTitle')}
        description={t('crm.deleteNoteDescription')}
        confirmText={isDeletingNote ? t('common.deleting') : t('common.delete')}
        cancelText={t('crm.cancel')}
        variant="danger"
        isLoading={isDeletingNote}
      />

      {/* Delete Contact Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={t('crm.deleteContactTitle')}
        description={`${t('crm.deleteContactDescription')}\n\n${primaryName || t('crm.contactProfile')}${
          secondaryName ? `\n${secondaryName}` : ''
        }`}
        confirmText={isDeleting ? t('common.deleting') : t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
