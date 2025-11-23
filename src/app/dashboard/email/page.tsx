/**
 * Email Page - Main email interface
 */

'use client';

import { useState, useEffect } from 'react';
import { Mail, Inbox, Send, FileText, AlertOctagon, Trash2, Settings, Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Email, EmailFolder, EmailAccount, EmailFolderType } from '@/shared/types/database';
import { toast } from 'sonner';
import Link from 'next/link';
import { ComposeEmailDialog } from '@/features/dashboard/components/compose-email-dialog';

export default function EmailPage() {
  const { canView, canWrite, isLoading: permLoading } = usePermissionLevel('email');
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ from: string; subject: string; messageId: string } | undefined>();

  useEffect(() => {
    if (canView) {
      loadAccounts();
    }
  }, [canView]);

  useEffect(() => {
    if (selectedAccount) {
      loadFolders(selectedAccount.id);
      // Don't auto-sync on load - let user click sync button manually
      // This prevents hanging on timeout errors
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedFolder) {
      loadEmails(selectedFolder.id);
    }
  }, [selectedFolder]);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<EmailAccount[]>('/api/email/accounts');
      if (response.success && response.data) {
        setAccounts(response.data);
        const defaultAccount = response.data.find(acc => acc.isDefault) || response.data[0];
        if (defaultAccount) {
          setSelectedAccount(defaultAccount);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load email accounts'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async (accountId: string) => {
    try {
      console.log('[EMAIL PAGE] Loading folders for account:', accountId);
      const response = await apiClient.get<EmailFolder[]>(`/api/email/folders?accountId=${accountId}`);
      console.log('[EMAIL PAGE] Folders response:', response);
      if (response.success && response.data) {
        console.log('[EMAIL PAGE] Loaded', response.data.length, 'folders');
        setFolders(response.data);
        const inbox = response.data.find(f => f.type === EmailFolderType.INBOX);
        if (inbox) {
          console.log('[EMAIL PAGE] Setting inbox folder:', inbox.id);
          setSelectedFolder(inbox);
        } else {
          console.log('[EMAIL PAGE] No inbox folder found!');
        }
      }
    } catch (error) {
      console.error('[EMAIL PAGE] Error loading folders:', error);
      toast.error(getErrorMessage(error, 'Failed to load folders'));
    }
  };

  const loadEmails = async (folderId: string) => {
    try {
      console.log('[EMAIL PAGE] Loading emails for folder:', folderId);
      setIsLoading(true);
      const response = await apiClient.get<Email[]>(`/api/email?folderId=${folderId}`);
      console.log('[EMAIL PAGE] Response received:', response);
      if (response.success && response.data) {
        console.log('[EMAIL PAGE] Loaded', response.data.length, 'emails');
        setEmails(response.data);
      } else {
        console.log('[EMAIL PAGE] No emails or unsuccessful response');
        setEmails([]);
      }
    } catch (error) {
      console.error('[EMAIL PAGE] Error loading emails:', error);
      toast.error(getErrorMessage(error, 'Failed to load emails'));
      setEmails([]); // Set empty array on error
    } finally {
      console.log('[EMAIL PAGE] Finished loading emails');
      setIsLoading(false);
    }
  };

  const syncEmails = async () => {
    if (!selectedAccount) return;

    const syncToastId = toast.loading('Syncing emails from server...');
    
    try {
      console.log('[EMAIL PAGE] Starting sync for account:', selectedAccount.id);
      
      const response = await apiClient.post('/api/email/sync', {
        accountId: selectedAccount.id
      });

      console.log('[EMAIL PAGE] Sync response:', response);

      if (response.success) {
        toast.success(response.message || 'Emails synced successfully', { id: syncToastId });
        
        // Reload current folder
        if (selectedFolder) {
          await loadEmails(selectedFolder.id);
          await loadFolders(selectedAccount.id);
        }
      }
    } catch (error) {
      console.error('[EMAIL PAGE] Sync error:', error);
      const errorMsg = getErrorMessage(error, 'Failed to sync emails');
      
      if (errorMsg.includes('Timed out') || errorMsg.includes('timeout')) {
        toast.error('Connection timeout. Please check: 1) Email credentials are correct, 2) IMAP is enabled, 3) Using App Password if required', {
          id: syncToastId,
          duration: 8000,
        });
      } else if (errorMsg.includes('AUTHENTICATIONFAILED') || errorMsg.includes('Invalid credentials')) {
        toast.error('Authentication failed. Please verify your email and password (use App Password for Gmail/Zoho)', {
          id: syncToastId,
          duration: 8000,
        });
      } else {
        toast.error(errorMsg, { id: syncToastId, duration: 5000 });
      }
    }
  };

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    
    if (!email.isRead) {
      try {
        await apiClient.put(`/api/email/${email.id}`, { isRead: true });
        setEmails(emails.map(e => e.id === email.id ? { ...e, isRead: true } : e));
        
        // Update folder unread count
        if (selectedFolder) {
          setFolders(folders.map(f => 
            f.id === selectedFolder.id 
              ? { ...f, unreadCount: Math.max(0, f.unreadCount - 1) }
              : f
          ));
        }
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const getFolderIcon = (type: EmailFolderType) => {
    switch (type) {
      case EmailFolderType.INBOX: return <Inbox className="h-4 w-4" />;
      case EmailFolderType.SENT: return <Send className="h-4 w-4" />;
      case EmailFolderType.DRAFTS: return <FileText className="h-4 w-4" />;
      case EmailFolderType.SPAM: return <AlertOctagon className="h-4 w-4" />;
      case EmailFolderType.TRASH: return <Trash2 className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (permLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have permission to view emails</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Mail className="h-16 w-16 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">No email accounts configured</h3>
          <p className="text-muted-foreground">Add an email account to get started</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/email/settings">
            <Plus className="h-4 w-4 mr-2" />
            Add Email Account
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email</h1>
          <p className="text-muted-foreground">{selectedAccount?.email}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={syncEmails} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync from Server
          </Button>
          <Button size="sm" onClick={() => { setReplyTo(undefined); setComposeOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/email/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Sidebar - Folders */}
        <Card className="col-span-2 p-4 overflow-y-auto">
          <div className="space-y-1">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-md text-sm
                  ${selectedFolder?.id === folder.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                `}
              >
                <div className="flex items-center space-x-2">
                  {getFolderIcon(folder.type)}
                  <span>{folder.name}</span>
                </div>
                {folder.unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {folder.unreadCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Email List */}
        <Card className="col-span-4 overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {emails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No emails in this folder</p>
              </div>
            ) : (
              <div className="divide-y">
                {emails.filter(email => 
                  searchQuery === '' || 
                  email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  email.from.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(email => (
                  <button
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-muted transition-colors
                      ${selectedEmail?.id === email.id ? 'bg-muted' : ''}
                      ${!email.isRead ? 'font-semibold' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm truncate flex-1">{email.from}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(email.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium truncate mb-1">{email.subject}</div>
                    <div className="text-xs text-muted-foreground truncate">{email.bodyText?.substring(0, 100)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Email Content */}
        <Card className="col-span-6 overflow-hidden flex flex-col">
          {selectedEmail ? (
            <>
              <div className="p-6 border-b space-y-4">
                <h2 className="text-2xl font-bold">{selectedEmail.subject}</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{selectedEmail.from}</div>
                    <div className="text-xs text-muted-foreground">
                      To: {selectedEmail.to.join(', ')}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(selectedEmail.receivedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml || selectedEmail.body }} />
              </div>
              <div className="p-4 border-t flex items-center space-x-2">
                <Button 
                  size="sm"
                  onClick={() => {
                    setReplyTo({
                      from: selectedEmail.from,
                      subject: selectedEmail.subject,
                      messageId: selectedEmail.messageId || selectedEmail.id
                    });
                    setComposeOpen(true);
                  }}
                >
                  Reply
                </Button>
                <Button size="sm" variant="outline">Forward</Button>
                <Button size="sm" variant="outline" className="ml-auto text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select an email to read</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Compose Email Dialog */}
      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open && selectedFolder) {
            // Refresh emails after closing compose dialog
            loadEmails(selectedFolder.id);
          }
        }}
        accounts={accounts}
        defaultAccountId={selectedAccount?.id}
        replyTo={replyTo}
      />
    </div>
  );
}
