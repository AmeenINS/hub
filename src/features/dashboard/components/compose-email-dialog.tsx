/**
 * Compose Email Dialog
 * Modal for composing and sending new emails
 */

'use client';

import { useState } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { EmailAccount, EmailPriority } from '@/shared/types/database';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { toast } from 'sonner';

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: EmailAccount[];
  defaultAccountId?: string;
  replyTo?: {
    from: string;
    subject: string;
    messageId: string;
  };
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  accounts,
  defaultAccountId,
  replyTo,
}: ComposeEmailDialogProps) {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    accountId: defaultAccountId || accounts[0]?.id || '',
    to: replyTo?.from || '',
    cc: '',
    bcc: '',
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    body: '',
    priority: EmailPriority.NORMAL,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.accountId || !formData.to || !formData.subject) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);

    try {
      const response = await apiClient.post('/api/email/send', {
        accountId: formData.accountId,
        to: formData.to.split(',').map(e => e.trim()).filter(Boolean),
        cc: formData.cc.split(',').map(e => e.trim()).filter(Boolean),
        bcc: formData.bcc.split(',').map(e => e.trim()).filter(Boolean),
        subject: formData.subject,
        body: formData.body,
        bodyHtml: `<p>${formData.body.replace(/\n/g, '<br>')}</p>`,
        priority: formData.priority,
        inReplyTo: replyTo?.messageId,
      });

      if (response.success) {
        toast.success('Email sent successfully');
        onOpenChange(false);
        setFormData({
          accountId: defaultAccountId || accounts[0]?.id || '',
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          body: '',
          priority: EmailPriority.NORMAL,
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send email'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{replyTo ? 'Reply to Email' : 'Compose Email'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Account */}
          <div className="space-y-2">
            <Label htmlFor="accountId">From *</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) => setFormData({ ...formData, accountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.displayName || account.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To */}
          <div className="space-y-2">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com (comma-separated for multiple)"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              required
            />
          </div>

          {/* CC */}
          <div className="space-y-2">
            <Label htmlFor="cc">CC</Label>
            <Input
              id="cc"
              type="email"
              placeholder="cc@example.com (comma-separated)"
              value={formData.cc}
              onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
            />
          </div>

          {/* BCC */}
          <div className="space-y-2">
            <Label htmlFor="bcc">BCC</Label>
            <Input
              id="bcc"
              type="email"
              placeholder="bcc@example.com (comma-separated)"
              value={formData.bcc}
              onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value as EmailPriority })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EmailPriority.LOW}>Low</SelectItem>
                <SelectItem value={EmailPriority.NORMAL}>Normal</SelectItem>
                <SelectItem value={EmailPriority.HIGH}>High</SelectItem>
                <SelectItem value={EmailPriority.URGENT}>Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message *</Label>
            <textarea
              id="body"
              className="w-full min-h-[300px] px-3 py-2 border rounded-md resize-y"
              placeholder="Write your message here..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
