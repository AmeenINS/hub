/**
 * IMAP Service - Email Fetching
 * Connects to IMAP servers and fetches emails
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { EmailAccount, Email, EmailPriority } from '@/shared/types/database';
import { EmailService, EmailFolderService } from '@/core/data/email-service';

interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions?: {
    rejectUnauthorized?: boolean;
  };
  connTimeout?: number;
  authTimeout?: number;
}

interface FetchedEmail {
  messageId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  date: Date;
  isRead: boolean;
}

export class ImapEmailService {
  private emailService: EmailService;
  private folderService: EmailFolderService;

  constructor() {
    this.emailService = new EmailService();
    this.folderService = new EmailFolderService();
  }

  /**
   * Create IMAP connection configuration
   */
  private createImapConfig(account: EmailAccount): ImapConfig {
    return {
      user: account.imapUsername,
      password: account.imapPassword,
      host: account.imapHost,
      port: account.imapPort,
      tls: account.imapUseSsl,
      tlsOptions: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
      connTimeout: 30000, // 30 seconds connection timeout
      authTimeout: 30000, // 30 seconds authentication timeout
    };
  }

  /**
   * Fetch emails from IMAP server
   */
  async fetchEmails(account: EmailAccount, folderName: string = 'INBOX'): Promise<FetchedEmail[]> {
    return new Promise((resolve, reject) => {
      const config = this.createImapConfig(account);
      console.log('[IMAP] Connecting to:', config.host + ':' + config.port, 'User:', config.user, 'SSL:', config.tls);
      const imap = new Imap(config);
      const fetchedEmails: FetchedEmail[] = [];

      imap.once('ready', () => {
        imap.openBox(folderName, true, (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Fetch last 50 emails
          const fetchCount = Math.min(box.messages.total, 50);
          if (fetchCount === 0) {
            imap.end();
            return resolve([]);
          }

          const startSeq = Math.max(1, box.messages.total - fetchCount + 1);
          const endSeq = box.messages.total;

          const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
            bodies: '',
            struct: true,
          });

          fetch.on('message', (msg, seqno) => {
            let buffer = '';
            let attributes: any;

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attrs) => {
              attributes = attrs;
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);
                
                // Parse addresses safely
                const parseAddresses = (field: any): string[] => {
                  if (!field) return [];
                  if (Array.isArray(field)) {
                    return field.flatMap(addr => 
                      addr.value ? addr.value.map((v: any) => v.address || '') : [addr.address || '']
                    ).filter(Boolean);
                  }
                  if (field.value) {
                    return Array.isArray(field.value) 
                      ? field.value.map((v: any) => v.address || '').filter(Boolean)
                      : [field.value.address || ''].filter(Boolean);
                  }
                  return [];
                };

                fetchedEmails.push({
                  messageId: parsed.messageId || `${seqno}-${Date.now()}`,
                  from: parsed.from?.text || '',
                  to: parseAddresses(parsed.to),
                  cc: parseAddresses(parsed.cc),
                  subject: parsed.subject || '(No Subject)',
                  bodyText: parsed.text || '',
                  bodyHtml: parsed.html || '',
                  date: parsed.date || new Date(),
                  isRead: attributes.flags?.includes('\\Seen') || false,
                });
              } catch (error) {
                console.error('Error parsing email:', error);
              }
            });
          });

          fetch.once('error', (err) => {
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
          });
        });
      });

      imap.once('error', (err: Error) => {
        console.error('[IMAP] Connection error:', err.message);
        const enhancedError = new Error(
          `IMAP connection failed: ${err.message}. ` +
          `Please check: 1) Credentials are correct, 2) IMAP is enabled in your email account, ` +
          `3) Server: ${config.host}:${config.port}, 4) Network connection is working`
        );
        reject(enhancedError);
      });

      imap.once('end', () => {
        console.log('[IMAP] Connection ended');
        resolve(fetchedEmails);
      });

      console.log('[IMAP] Initiating connection...');
      imap.connect();
    });
  }

  /**
   * Sync emails from IMAP to database
   */
  async syncEmails(account: EmailAccount, userId: string): Promise<number> {
    try {
      // Get INBOX folder
      console.log('Syncing emails for account:', account.id, account.email);
      const folders = await this.folderService.getFoldersByAccount(account.id);
      console.log('Found folders:', folders.length, folders.map(f => f.type));
      const inboxFolder = folders.find(f => f.type === 'INBOX');
      
      if (!inboxFolder) {
        console.error('INBOX folder not found. Available folders:', folders);
        throw new Error(`INBOX folder not found for account ${account.email}. Available folders: ${folders.map(f => f.type).join(', ')}`);
      }

      console.log('Fetching emails from IMAP for inbox:', inboxFolder.id);
      // Fetch emails from IMAP
      const fetchedEmails = await this.fetchEmails(account, 'INBOX');
      console.log('Fetched emails count:', fetchedEmails.length);
      
      // Get existing message IDs to avoid duplicates
      const existingEmails = await this.emailService.getEmailsByFolder(inboxFolder.id);
      const existingMessageIds = new Set(existingEmails.map(e => e.messageId));

      let syncedCount = 0;

      // Save new emails to database
      for (const fetched of fetchedEmails) {
        if (!existingMessageIds.has(fetched.messageId)) {
          await this.emailService.createEmail({
            accountId: account.id,
            folderId: inboxFolder.id,
            from: fetched.from,
            to: fetched.to,
            cc: fetched.cc,
            subject: fetched.subject,
            bodyText: fetched.bodyText,
            bodyHtml: fetched.bodyHtml,
            body: fetched.bodyText,
            messageId: fetched.messageId,
            isRead: fetched.isRead,
            isStarred: false,
            isFlagged: false,
            isDraft: false,
            hasAttachments: false,
            priority: EmailPriority.NORMAL,
            receivedAt: fetched.date.toISOString(),
          });
          syncedCount++;
        }
      }

      // Update folder counts
      await this.folderService.updateFolderCounts(inboxFolder.id);

      return syncedCount;
    } catch (error) {
      console.error('Error syncing emails:', error);
      throw error;
    }
  }

  /**
   * Test IMAP connection
   */
  async testConnection(account: EmailAccount): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const config = this.createImapConfig(account);
      console.log('[IMAP TEST] Connecting to:', config.host + ':' + config.port, 'User:', config.user, 'SSL:', config.tls);
      const imap = new Imap(config);

      let connectionTimeout = setTimeout(() => {
        imap.end();
        reject(new Error('Connection timeout after 30 seconds. Check server address and firewall settings.'));
      }, 30000);

      imap.once('ready', () => {
        clearTimeout(connectionTimeout);
        console.log('[IMAP TEST] Connection successful!');
        imap.end();
        resolve(true);
      });

      imap.once('error', (err: Error) => {
        clearTimeout(connectionTimeout);
        console.error('[IMAP TEST] Connection error:', err.message);
        reject(err);
      });

      imap.once('end', () => {
        clearTimeout(connectionTimeout);
      });

      console.log('[IMAP TEST] Initiating connection...');
      imap.connect();
    });
  }
}
