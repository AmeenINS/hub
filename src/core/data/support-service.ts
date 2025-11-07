import { lmdb } from './lmdb';
import { SupportMessage, SupportMessageStatus } from '@/shared/types/database';
import { nanoid } from 'nanoid';

/**
 * Support Service
 * Handles support messages from users to administrators
 */
export class SupportService {
  private readonly dbName = 'support_messages';

  /**
   * Create a new support message
   */
  async createMessage(data: {
    userId: string;
    subject: string;
    message: string;
  }): Promise<SupportMessage> {
    const id = nanoid();
    
    const supportMessage: SupportMessage = {
      id,
      ...data,
      status: SupportMessageStatus.OPEN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, supportMessage);
    return supportMessage;
  }

  /**
   * Get all messages from a specific user
   */
  async getUserMessages(userId: string): Promise<SupportMessage[]> {
    const messages = await lmdb.query<SupportMessage>(
      this.dbName,
      (msg) => msg.userId === userId
    );
    
    return messages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get all support messages (admin only)
   */
  async getAllMessages(): Promise<SupportMessage[]> {
    const messages = await lmdb.getAll<SupportMessage>(this.dbName);
    return messages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get a specific message by ID
   */
  async getMessageById(id: string): Promise<SupportMessage | null> {
    return lmdb.getById<SupportMessage>(this.dbName, id);
  }

  /**
   * Reply to a support message (admin only)
   */
  async replyToMessage(
    id: string,
    adminReply: string,
    repliedBy: string
  ): Promise<SupportMessage | null> {
    return lmdb.update<SupportMessage>(this.dbName, id, {
      adminReply,
      repliedBy,
      repliedAt: new Date().toISOString(),
      status: SupportMessageStatus.IN_PROGRESS,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Close a support message
   */
  async closeMessage(id: string): Promise<SupportMessage | null> {
    return lmdb.update<SupportMessage>(this.dbName, id, {
      status: SupportMessageStatus.CLOSED,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Delete a support message
   */
  async deleteMessage(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}
