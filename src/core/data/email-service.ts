/**
 * Email Service
 * Handles email operations using LMDB
 */

import { lmdb } from './lmdb';
import { Email, EmailAccount, EmailFolder, EmailDraft, EmailFolderType } from '@/shared/types/database';
import { nanoid } from 'nanoid';

// ==================== Email Account Service ====================

export class EmailAccountService {
  private readonly dbName = 'email_accounts';

  async createAccount(accountData: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailAccount> {
    const id = nanoid();
    const account: EmailAccount = {
      ...accountData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, account);
    
    // Create default folders
    const folderService = new EmailFolderService();
    for (const type of [EmailFolderType.INBOX, EmailFolderType.SENT, EmailFolderType.DRAFTS, EmailFolderType.SPAM, EmailFolderType.TRASH]) {
      await folderService.createFolder({
        accountId: id,
        name: type,
        type,
        unreadCount: 0,
        totalCount: 0
      });
    }
    
    return account;
  }

  async getAccountById(id: string): Promise<EmailAccount | null> {
    return lmdb.getById<EmailAccount>(this.dbName, id);
  }

  async getAccountsByUser(userId: string): Promise<EmailAccount[]> {
    const allAccounts = await lmdb.getAll<EmailAccount>(this.dbName);
    return allAccounts.filter(acc => acc.userId === userId);
  }

  async getDefaultAccount(userId: string): Promise<EmailAccount | null> {
    const accounts = await this.getAccountsByUser(userId);
    return accounts.find(acc => acc.isDefault) || accounts[0] || null;
  }

  async updateAccount(id: string, updates: Partial<EmailAccount>): Promise<EmailAccount> {
    const existing = await this.getAccountById(id);
    if (!existing) throw new Error('Account not found');
    
    const updated: EmailAccount = { 
      ...existing, 
      ...updates, 
      id, 
      updatedAt: new Date().toISOString() 
    };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}

// ==================== Email Folder Service ====================

export class EmailFolderService {
  private readonly dbName = 'email_folders';

  async createFolder(folderData: Omit<EmailFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailFolder> {
    const id = nanoid();
    const folder: EmailFolder = {
      ...folderData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, folder);
    return folder;
  }

  async getFolderById(id: string): Promise<EmailFolder | null> {
    return lmdb.getById<EmailFolder>(this.dbName, id);
  }

  async getFoldersByAccount(accountId: string): Promise<EmailFolder[]> {
    const allFolders = await lmdb.getAll<EmailFolder>(this.dbName);
    return allFolders.filter(folder => folder.accountId === accountId);
  }

  async getFolderByType(accountId: string, type: EmailFolderType): Promise<EmailFolder | null> {
    const folders = await this.getFoldersByAccount(accountId);
    return folders.find(f => f.type === type) || null;
  }

  async updateFolder(id: string, updates: Partial<EmailFolder>): Promise<EmailFolder> {
    const existing = await this.getFolderById(id);
    if (!existing) throw new Error('Folder not found');
    
    const updated: EmailFolder = { 
      ...existing, 
      ...updates, 
      id, 
      updatedAt: new Date().toISOString() 
    };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async updateFolderCounts(folderId: string): Promise<void> {
    const emailService = new EmailService();
    const emails = await emailService.getEmailsByFolder(folderId);
    const unreadCount = emails.filter(e => !e.isRead && !e.isDeleted).length;
    const totalCount = emails.filter(e => !e.isDeleted).length;
    
    await this.updateFolder(folderId, { unreadCount, totalCount });
  }

  async deleteFolder(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}

// ==================== Email Service ====================

export class EmailService {
  private readonly dbName = 'emails';

  async createEmail(emailData: Omit<Email, 'id' | 'createdAt' | 'updatedAt'>): Promise<Email> {
    const id = nanoid();
    const email: Email = {
      ...emailData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, email);
    
    // Update folder counts
    const folderService = new EmailFolderService();
    await folderService.updateFolderCounts(emailData.folderId);
    
    return email;
  }

  async getEmailById(id: string): Promise<Email | null> {
    return lmdb.getById<Email>(this.dbName, id);
  }

  async getEmailsByAccount(accountId: string): Promise<Email[]> {
    const allEmails = await lmdb.getAll<Email>(this.dbName);
    return allEmails.filter(email => email.accountId === accountId && !email.isDeleted);
  }

  async getEmailsByFolder(folderId: string): Promise<Email[]> {
    const allEmails = await lmdb.getAll<Email>(this.dbName);
    return allEmails.filter(email => email.folderId === folderId && !email.isDeleted)
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }

  async searchEmails(accountId: string, query: string): Promise<Email[]> {
    const emails = await this.getEmailsByAccount(accountId);
    const lowerQuery = query.toLowerCase();
    
    return emails.filter(email => 
      email.subject.toLowerCase().includes(lowerQuery) ||
      email.from.toLowerCase().includes(lowerQuery) ||
      email.to.some(to => to.toLowerCase().includes(lowerQuery)) ||
      email.body.toLowerCase().includes(lowerQuery)
    );
  }

  async updateEmail(id: string, updates: Partial<Email>): Promise<Email> {
    const existing = await this.getEmailById(id);
    if (!existing) throw new Error('Email not found');
    
    const updated: Email = { 
      ...existing, 
      ...updates, 
      id, 
      updatedAt: new Date().toISOString() 
    };
    await lmdb.update(this.dbName, id, updated);
    
    // Update folder counts if folder changed or read status changed
    if (updates.folderId || updates.isRead !== undefined) {
      const folderService = new EmailFolderService();
      if (updates.folderId && updates.folderId !== existing.folderId) {
        await folderService.updateFolderCounts(existing.folderId);
        await folderService.updateFolderCounts(updates.folderId);
      } else {
        await folderService.updateFolderCounts(existing.folderId);
      }
    }
    
    return updated;
  }

  async moveToFolder(emailId: string, targetFolderId: string): Promise<Email> {
    return this.updateEmail(emailId, { folderId: targetFolderId });
  }

  async markAsRead(emailId: string): Promise<Email> {
    return this.updateEmail(emailId, { isRead: true });
  }

  async markAsUnread(emailId: string): Promise<Email> {
    return this.updateEmail(emailId, { isRead: false });
  }

  async toggleStar(emailId: string): Promise<Email> {
    const email = await this.getEmailById(emailId);
    if (!email) throw new Error('Email not found');
    return this.updateEmail(emailId, { isStarred: !email.isStarred });
  }

  async softDeleteEmail(id: string): Promise<boolean> {
    const email = await this.getEmailById(id);
    if (!email) return false;
    
    await this.updateEmail(id, {
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
    
    return true;
  }

  async permanentDeleteEmail(id: string): Promise<boolean> {
    const email = await this.getEmailById(id);
    if (!email) return false;
    
    const folderService = new EmailFolderService();
    await folderService.updateFolderCounts(email.folderId);
    
    return lmdb.delete(this.dbName, id);
  }

  async getUnreadCount(accountId: string): Promise<number> {
    const emails = await this.getEmailsByAccount(accountId);
    return emails.filter(e => !e.isRead).length;
  }
}

// ==================== Email Draft Service ====================

export class EmailDraftService {
  private readonly dbName = 'email_drafts';

  async createDraft(draftData: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDraft> {
    const id = nanoid();
    const draft: EmailDraft = {
      ...draftData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await lmdb.create(this.dbName, id, draft);
    return draft;
  }

  async getDraftById(id: string): Promise<EmailDraft | null> {
    return lmdb.getById<EmailDraft>(this.dbName, id);
  }

  async getDraftsByAccount(accountId: string): Promise<EmailDraft[]> {
    const allDrafts = await lmdb.getAll<EmailDraft>(this.dbName);
    return allDrafts.filter(draft => draft.accountId === accountId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateDraft(id: string, updates: Partial<EmailDraft>): Promise<EmailDraft> {
    const existing = await this.getDraftById(id);
    if (!existing) throw new Error('Draft not found');
    
    const updated: EmailDraft = { 
      ...existing, 
      ...updates, 
      id, 
      updatedAt: new Date().toISOString() 
    };
    await lmdb.update(this.dbName, id, updated);
    return updated;
  }

  async deleteDraft(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}
