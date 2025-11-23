/**
 * API: POST /api/email/sync
 * Sync emails from IMAP server
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { EmailAccountService } from '@/core/data/email-service';
import { ImapEmailService } from '@/core/email/imap-service';

export async function POST(request: NextRequest) {
  try {
    console.log('[EMAIL SYNC] Starting sync request');
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.error('[EMAIL SYNC] No auth token found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      console.error('[EMAIL SYNC] Invalid token');
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log('[EMAIL SYNC] User authenticated:', payload.userId);

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      console.error('[EMAIL SYNC] No account ID provided');
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    console.log('[EMAIL SYNC] Account ID:', accountId);

    // Get email account and verify ownership
    const accountService = new EmailAccountService();
    const account = await accountService.getAccountById(accountId);

    if (!account) {
      console.error('[EMAIL SYNC] Account not found:', accountId);
      return NextResponse.json(
        { success: false, error: 'Email account not found' },
        { status: 404 }
      );
    }

    console.log('[EMAIL SYNC] Account found:', account.email);
    console.log('[EMAIL SYNC] IMAP Username:', account.imapUsername);
    console.log('[EMAIL SYNC] IMAP Host:', account.imapHost, 'Port:', account.imapPort, 'SSL:', account.imapUseSsl);
    console.log('[EMAIL SYNC] Account has IMAP password?', !!account.imapPassword);
    console.log('[EMAIL SYNC] Password length:', account.imapPassword?.length || 0);
    console.log('[EMAIL SYNC] Password starts with:', account.imapPassword?.substring(0, 3) + '...');

    if (account.userId !== payload.userId) {
      console.error('[EMAIL SYNC] Access denied for user:', payload.userId);
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Sync emails from IMAP
    console.log('[EMAIL SYNC] Starting IMAP sync...');
    const imapService = new ImapEmailService();
    const syncedCount = await imapService.syncEmails(account, payload.userId);
    console.log('[EMAIL SYNC] Sync completed. Count:', syncedCount);

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} new emails`,
      data: { syncedCount },
    });
  } catch (error: any) {
    console.error('[EMAIL SYNC] ERROR occurred:', error.message);
    console.error('[EMAIL SYNC] Error details:', error);
    console.error('[EMAIL SYNC] Error stack:', error.stack);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to sync emails',
        error: error.message || 'Failed to sync emails',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
