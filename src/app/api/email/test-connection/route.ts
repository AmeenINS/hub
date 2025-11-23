/**
 * API: POST /api/email/test-connection
 * Test IMAP/SMTP connection without saving
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { ImapEmailService } from '@/core/email/imap-service';
import { EmailAccount } from '@/shared/types/database';

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST CONNECTION] Starting test');
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Create temporary account object for testing
    const testAccount: EmailAccount = {
      id: 'test',
      userId: payload.userId,
      email: body.email,
      displayName: body.displayName || body.email,
      imapHost: body.imapHost,
      imapPort: body.imapPort,
      imapUsername: body.imapUsername,
      imapPassword: body.imapPassword,
      imapUseSsl: body.imapUseSsl,
      smtpHost: body.smtpHost,
      smtpPort: body.smtpPort,
      smtpUsername: body.smtpUsername,
      smtpPassword: body.smtpPassword,
      smtpUseSsl: body.smtpUseSsl,
      isDefault: false,
      syncEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('[TEST CONNECTION] Testing IMAP for:', testAccount.email);
    console.log('[TEST CONNECTION] IMAP Config:', {
      host: testAccount.imapHost,
      port: testAccount.imapPort,
      username: testAccount.imapUsername,
      ssl: testAccount.imapUseSsl,
      hasPassword: !!testAccount.imapPassword,
      passwordLength: testAccount.imapPassword?.length || 0
    });

    // Test IMAP connection
    const imapService = new ImapEmailService();
    
    try {
      const isConnected = await imapService.testConnection(testAccount);

      if (isConnected) {
        console.log('[TEST CONNECTION] Success!');
        return NextResponse.json({
          success: true,
          message: 'IMAP connection successful! You can now save this account.',
        });
      } else {
        console.log('[TEST CONNECTION] Failed - returned false');
        return NextResponse.json({
          success: false,
          message: 'Failed to connect. Please check your credentials and server settings.',
        }, { status: 400 });
      }
    } catch (testError: any) {
      console.error('[TEST CONNECTION] Exception during test:', testError.message);
      throw testError; // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    console.error('[TEST CONNECTION] ERROR:', error.message);
    console.error('[TEST CONNECTION] Details:', error);
    
    let errorMessage = error.message || 'Connection test failed';
    
    // Provide helpful error messages
    if (errorMessage.includes('timeout') || errorMessage.includes('Timed out')) {
      errorMessage = 'Connection timeout. Check: 1) Server address and port are correct, 2) Firewall is not blocking, 3) IMAP is enabled in your email account.';
    } else if (errorMessage.includes('AUTHENTICATIONFAILED') || errorMessage.includes('Invalid credentials')) {
      errorMessage = 'Authentication failed. Make sure you are using an App Password (not your regular password) for Gmail/Zoho.';
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      errorMessage = 'Server not found. Please check the IMAP host address.';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused. Check the IMAP port number and SSL settings.';
    }
    
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
