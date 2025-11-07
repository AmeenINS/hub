'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { LifeBuoy, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { SupportMessageStatus } from '@/shared/types/database';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/state/auth-store';

interface SupportMessage {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: SupportMessageStatus;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupportPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  // Check permissions
  const checkAccess = useCallback(async () => {
    if (!token || !isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/users/me/permissions?modules=support', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const permissions = await response.json();
        const hasReadAccess = permissions.support && permissions.support.length > 0;
        setHasAccess(hasReadAccess);
        
        if (!hasReadAccess) {
          router.push('/dashboard/access-denied');
        }
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setHasAccess(false);
      router.push('/dashboard/access-denied');
    }
  }, [token, isAuthenticated, router]);

  const fetchMessages = useCallback(async () => {
    if (hasAccess === false) return;
    
    try {
      setLoading(true);
      
      if (!token || !isAuthenticated) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/support', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again');
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        router.push('/dashboard/access-denied');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [router, token, isAuthenticated, hasAccess]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (hasAccess === true) {
      fetchMessages();
    }
  }, [fetchMessages, hasAccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error(t('support.fillAllFields'));
      return;
    }

    if (!token) {
      toast.error('Please login to continue');
      router.push('/login');
      return;
    }

    try {
      setSending(true);
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(t('support.sendSuccess'));
        setFormData({ subject: '', message: '' });
        fetchMessages();
      } else {
        toast.error(t('support.sendError'));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(t('support.sendError'));
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: SupportMessageStatus) => {
    switch (status) {
      case SupportMessageStatus.OPEN:
        return <Badge variant="default">{t('support.open')}</Badge>;
      case SupportMessageStatus.IN_PROGRESS:
        return <Badge variant="secondary">{t('support.inProgress')}</Badge>;
      case SupportMessageStatus.CLOSED:
        return <Badge variant="outline">{t('support.closed')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LifeBuoy className="h-8 w-8" />
          {t('support.title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('support.description')}</p>
      </div>

      {/* Send Message Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('support.sendMessage')}</CardTitle>
          <CardDescription>{t('support.messageToAdmin')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">{t('support.subject')}</Label>
              <Input
                id="subject"
                placeholder={t('support.subjectPlaceholder')}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('support.message')}</Label>
              <Textarea
                id="message"
                placeholder={t('support.messagePlaceholder')}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                required
              />
            </div>

            <Button type="submit" disabled={sending}>
              {sending ? (
                t('common.loading')
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('support.sendMessage')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Messages */}
      <Card>
        <CardHeader>
          <CardTitle>{t('support.yourMessages')}</CardTitle>
          <CardDescription>
            {t('support.viewPreviousMessages')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">{t('support.noMessages')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <Card key={msg.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{msg.subject}</CardTitle>
                        <CardDescription>
                          {formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                            locale: locale === 'ar' ? ar : enUS,
                          })}
                        </CardDescription>
                      </div>
                      {getStatusBadge(msg.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">{t('support.yourMessage')}:</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {msg.message}
                      </p>
                    </div>

                    {msg.adminReply && (
                      <div>
                        <p className="text-sm font-medium mb-2">{t('support.adminReply')}:</p>
                        <p className="text-sm text-muted-foreground bg-primary/10 p-3 rounded-md border border-primary/20">
                          {msg.adminReply}
                        </p>
                        {msg.repliedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(msg.repliedAt), {
                              addSuffix: true,
                              locale: locale === 'ar' ? ar : enUS,
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {msg.status === SupportMessageStatus.OPEN && !msg.adminReply && (
                      <p className="text-sm text-muted-foreground italic">
                        {t('support.waitingForReply')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
