/**
 * Email Settings Page - IMAP/SMTP Configuration
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Mail, Trash2, Star, Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { EmailAccount } from '@/shared/types/database';
import { toast } from 'sonner';
import Link from 'next/link';

interface EmailAccountFormData {
  email: string;
  displayName: string;
  imapHost: string;
  imapPort: number;
  imapUsername: string;
  imapPassword: string;
  imapUseSsl: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpUseSsl: boolean;
  signature?: string;
  isDefault: boolean;
}

export default function EmailSettingsPage() {
  const { canView, canAdmin: canManageAccounts } = usePermissionLevel('email');
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('zoho');
  const [formData, setFormData] = useState<EmailAccountFormData>({
    email: '',
    displayName: '',
    imapHost: 'imappro.zoho.com',
    imapPort: 993,
    imapUsername: '',
    imapPassword: '',
    imapUseSsl: true,
    smtpHost: 'smtppro.zoho.com',
    smtpPort: 465,
    smtpUsername: '',
    smtpPassword: '',
    smtpUseSsl: true,
    signature: '',
    isDefault: false
  });

  useEffect(() => {
    if (canView) {
      loadAccounts();
    }
  }, [canView]);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<EmailAccount[]>('/api/email/accounts');
      if (response.success && response.data) {
        setAccounts(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load email accounts'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageAccounts) {
      toast.error('You don\'t have permission to manage email accounts');
      return;
    }

    try {
      const response = await apiClient.post<EmailAccount>('/api/email/accounts', formData);
      if (response.success) {
        toast.success('Email account added successfully');
        loadAccounts();
        setShowForm(false);
        resetForm();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to add email account'));
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!canManageAccounts) {
      toast.error('You don\'t have permission to delete email accounts');
      return;
    }

    if (!confirm('Are you sure you want to delete this email account?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/email/accounts/${accountId}`);
      if (response.success) {
        toast.success('Email account deleted successfully');
        loadAccounts();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete email account'));
    }
  };

  const emailProviders: Record<string, { imapHost: string; imapPort: number; smtpHost: string; smtpPort: number }> = {
    zoho: { imapHost: 'imappro.zoho.com', imapPort: 993, smtpHost: 'smtppro.zoho.com', smtpPort: 465 },
    gmail: { imapHost: 'imap.gmail.com', imapPort: 993, smtpHost: 'smtp.gmail.com', smtpPort: 465 },
    outlook: { imapHost: 'outlook.office365.com', imapPort: 993, smtpHost: 'smtp.office365.com', smtpPort: 587 },
    custom: { imapHost: '', imapPort: 993, smtpHost: '', smtpPort: 465 }
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const preset = emailProviders[provider];
    setFormData(prev => ({
      ...prev,
      imapHost: preset.imapHost,
      imapPort: preset.imapPort,
      smtpHost: preset.smtpHost,
      smtpPort: preset.smtpPort,
      imapUseSsl: true,
      smtpUseSsl: true
    }));
  };

  const resetForm = () => {
    setSelectedProvider('zoho');
    setFormData({
      email: '',
      displayName: '',
      imapHost: 'imappro.zoho.com',
      imapPort: 993,
      imapUsername: '',
      imapPassword: '',
      imapUseSsl: true,
      smtpHost: 'smtppro.zoho.com',
      smtpPort: 465,
      smtpUsername: '',
      smtpPassword: '',
      smtpUseSsl: true,
      signature: '',
      isDefault: false
    });
    setEditingAccount(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have permission to view email settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Settings</h1>
          <p className="text-muted-foreground">Manage your email accounts and IMAP/SMTP configuration</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/email">
            <Mail className="h-4 w-4 mr-2" />
            Back to Inbox
          </Link>
        </Button>
      </div>

      {/* Email Accounts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Accounts</CardTitle>
              <CardDescription>Configure IMAP and SMTP settings for your email accounts</CardDescription>
            </div>
            {canManageAccounts && (
              <Button onClick={() => setShowForm(!showForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No email accounts configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map(account => (
                <Card key={account.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Mail className="h-10 w-10 text-primary" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{account.displayName || account.email}</h3>
                            {account.isDefault && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{account.email}</p>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div>IMAP: {account.imapHost}:{account.imapPort} {account.imapUseSsl && '(SSL)'}</div>
                            <div>SMTP: {account.smtpHost}:{account.smtpPort} {account.smtpUseSsl && '(SSL)'}</div>
                          </div>
                        </div>
                      </div>
                      {canManageAccounts && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Form */}
      {showForm && canManageAccounts && (
        <Card>
          <CardHeader>
            <CardTitle>Add Email Account</CardTitle>
            <CardDescription>Enter your email account details and IMAP/SMTP configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Provider Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold">Email Provider</h3>
                <div className="space-y-2">
                  <Label htmlFor="provider">Select Provider</Label>
                  <Select value={selectedProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoho">Zoho Mail (Default)</SelectItem>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook/Office 365</SelectItem>
                      <SelectItem value="custom">Custom Server</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select your email provider. Server settings will be filled automatically.
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Account Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* IMAP Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">IMAP Configuration (Incoming Mail)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imapHost">IMAP Host *</Label>
                    <Input
                      id="imapHost"
                      placeholder="imappro.zoho.com"
                      value={formData.imapHost}
                      onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapPort">IMAP Port *</Label>
                    <Input
                      id="imapPort"
                      type="number"
                      value={formData.imapPort}
                      onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapUsername">IMAP Username *</Label>
                    <Input
                      id="imapUsername"
                      value={formData.imapUsername}
                      onChange={(e) => setFormData({ ...formData, imapUsername: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapPassword">IMAP Password *</Label>
                    <Input
                      id="imapPassword"
                      type="password"
                      value={formData.imapPassword}
                      onChange={(e) => setFormData({ ...formData, imapPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="imapUseSsl"
                      checked={formData.imapUseSsl}
                      onCheckedChange={(checked) => setFormData({ ...formData, imapUseSsl: checked })}
                    />
                    <Label htmlFor="imapUseSsl">Use SSL/TLS</Label>
                  </div>
                </div>
              </div>

              {/* SMTP Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">SMTP Configuration (Outgoing Mail)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host *</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtppro.zoho.com"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port *</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">SMTP Username *</Label>
                    <Input
                      id="smtpUsername"
                      value={formData.smtpUsername}
                      onChange={(e) => setFormData({ ...formData, smtpUsername: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTP Password *</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={formData.smtpPassword}
                      onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtpUseSsl"
                      checked={formData.smtpUseSsl}
                      onCheckedChange={(checked) => setFormData({ ...formData, smtpUseSsl: checked })}
                    />
                    <Label htmlFor="smtpUseSsl">Use SSL/TLS</Label>
                  </div>
                </div>
              </div>

              {/* Other Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Additional Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="signature">Email Signature</Label>
                  <textarea
                    id="signature"
                    placeholder="Your email signature..."
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                    value={formData.signature}
                    onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  />
                  <Label htmlFor="isDefault">Set as default account</Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Account
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
