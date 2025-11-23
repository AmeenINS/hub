/**
 * Email Accounts API
 * GET/POST - List and create email accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmailAccountService } from '@/core/data/email-service';
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

    const accountService = new EmailAccountService();
    const accounts = await accountService.getAccountsByUser(payload.userId);

    // Remove sensitive password info from response
    const sanitizedAccounts = accounts.map(acc => ({
      ...acc,
      imapPassword: '***',
      smtpPassword: '***'
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedAccounts
    });
  } catch (error) {
    logError('GET /api/email/accounts', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const hasPermission = await checkPermission(payload.userId, 'email', 'manage_accounts');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const accountService = new EmailAccountService();

    // If this is the first account or marked as default, set as default
    const existingAccounts = await accountService.getAccountsByUser(payload.userId);
    const isDefault = existingAccounts.length === 0 || body.isDefault === true;

    // If setting as default, unset other defaults
    if (isDefault && existingAccounts.length > 0) {
      for (const acc of existingAccounts.filter(a => a.isDefault)) {
        await accountService.updateAccount(acc.id, { isDefault: false });
      }
    }

    console.log('[CREATE ACCOUNT] Email:', body.email);
    console.log('[CREATE ACCOUNT] IMAP password received?', !!body.imapPassword);
    console.log('[CREATE ACCOUNT] IMAP password length:', body.imapPassword?.length || 0);
    
    const account = await accountService.createAccount({
      ...body,
      userId: payload.userId,
      isDefault,
      syncEnabled: body.syncEnabled !== false,
    });
    
    console.log('[CREATE ACCOUNT] Account created with ID:', account.id);

    // Remove sensitive info
    const sanitizedAccount = {
      ...account,
      imapPassword: '***',
      smtpPassword: '***'
    };

    return NextResponse.json({
      success: true,
      data: sanitizedAccount,
      message: 'Email account created successfully'
    }, { status: 201 });
  } catch (error) {
    logError('POST /api/email/accounts', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
