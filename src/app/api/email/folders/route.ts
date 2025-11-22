/**
 * Email Folders API
 * GET - List folders for an account
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmailFolderService, EmailAccountService } from '@/core/data/email-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

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
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId required' }, { status: 400 });
    }

    // Verify account belongs to user
    const accountService = new EmailAccountService();
    const account = await accountService.getAccountById(accountId);
    
    if (!account || account.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Invalid account' }, { status: 403 });
    }

    const folderService = new EmailFolderService();
    const folders = await folderService.getFoldersByAccount(accountId);

    return NextResponse.json({
      success: true,
      data: folders
    });
  } catch (error) {
    logError('GET /api/email/folders', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
