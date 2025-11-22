/**
 * Emails API
 * GET - List emails by folder
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmailService, EmailAccountService, EmailFolderService } from '@/core/data/email-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';
import { Email, EmailFolderType } from '@/shared/types/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const hasPermission = await checkPermission(payload.userId, 'email', 'view');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const accountId = searchParams.get('accountId');
    const search = searchParams.get('search');

    const emailService = new EmailService();
    const accountService = new EmailAccountService();
    const folderService = new EmailFolderService();
    let emails: Email[];

    if (search && accountId) {
      // Verify account belongs to user
      const account = await accountService.getAccountById(accountId);
      if (!account || account.userId !== payload.userId) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
      }
      emails = await emailService.searchEmails(accountId, search);
    } else if (folderId) {
      // Verify folder belongs to user's account
      const folder = await folderService.getFolderById(folderId);
      if (!folder) {
        return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
      }
      const account = await accountService.getAccountById(folder.accountId);
      if (!account || account.userId !== payload.userId) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
      }
      emails = await emailService.getEmailsByFolder(folderId);
    } else if (accountId) {
      // Verify account belongs to user
      const account = await accountService.getAccountById(accountId);
      if (!account || account.userId !== payload.userId) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
      }
      emails = await emailService.getEmailsByAccount(accountId);
    } else {
      // Get default account
      const defaultAccount = await accountService.getDefaultAccount(payload.userId);
      
      if (!defaultAccount) {
        return NextResponse.json({
          success: true,
          data: []
        });
      }

      // Get inbox folder
      const inbox = await folderService.getFolderByType(defaultAccount.id, EmailFolderType.INBOX);
      
      if (inbox) {
        emails = await emailService.getEmailsByFolder(inbox.id);
      } else {
        emails = [];
      }
    }

    return NextResponse.json({
      success: true,
      data: emails
    });
  } catch (error) {
    logError('GET /api/email', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
