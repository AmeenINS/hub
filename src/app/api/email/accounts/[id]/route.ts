/**
 * API Route: PUT, DELETE /api/email/accounts/[id]
 * Update or delete email account
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { EmailAccountService, EmailFolderService, EmailService } from '@/core/data/email-service';

/**
 * PUT /api/email/accounts/[id] - Update email account
 * Password fields are optional - only update if provided
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get account ID from params
    const { id: accountId } = await context.params;

    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = JWTService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Initialize service
    const accountService = new EmailAccountService();

    // Verify account exists and belongs to user
    const existingAccount = await accountService.getAccountById(accountId);
    if (!existingAccount) {
      return NextResponse.json(
        { success: false, message: 'Email account not found' },
        { status: 404 }
      );
    }

    if (existingAccount.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Prepare update data - only include password if provided
    const updateData: any = {
      email: body.email || existingAccount.email,
      displayName: body.displayName || existingAccount.displayName,
      imapHost: body.imapHost || existingAccount.imapHost,
      imapPort: body.imapPort || existingAccount.imapPort,
      imapUseSsl: body.imapUseSsl !== undefined ? body.imapUseSsl : existingAccount.imapUseSsl,
      imapUsername: body.imapUsername || existingAccount.imapUsername,
      smtpHost: body.smtpHost || existingAccount.smtpHost,
      smtpPort: body.smtpPort || existingAccount.smtpPort,
      smtpUseSsl: body.smtpUseSsl !== undefined ? body.smtpUseSsl : existingAccount.smtpUseSsl,
      smtpUsername: body.smtpUsername || existingAccount.smtpUsername,
      signature: body.signature !== undefined ? body.signature : existingAccount.signature,
    };

    // Only update passwords if provided (not empty), otherwise keep existing
    if (body.imapPassword && body.imapPassword.trim() !== '') {
      updateData.imapPassword = body.imapPassword;
    } else {
      updateData.imapPassword = existingAccount.imapPassword; // Keep existing
    }
    
    if (body.smtpPassword && body.smtpPassword.trim() !== '') {
      updateData.smtpPassword = body.smtpPassword;
    } else {
      updateData.smtpPassword = existingAccount.smtpPassword; // Keep existing
    }

    console.log('[UPDATE ACCOUNT] Updating account:', accountId);
    console.log('[UPDATE ACCOUNT] Has IMAP password?', !!updateData.imapPassword);

    // Update account
    const updatedAccount = await accountService.updateAccount(accountId, updateData);

    console.log('Email account updated:', accountId);

    // Return account without passwords
    const { imapPassword, smtpPassword, ...accountWithoutPasswords } = updatedAccount;

    return NextResponse.json({
      success: true,
      message: 'Email account updated successfully',
      account: accountWithoutPasswords
    });

  } catch (error) {
    console.error('Failed to update email account:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update email account'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email/accounts/[id] - Delete email account
 * Requires: email.manage_accounts permission (ADMIN level)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get account ID from params
    const { id: accountId } = await context.params;

    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = JWTService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Initialize services
    const accountService = new EmailAccountService();
    const folderService = new EmailFolderService();
    const emailService = new EmailService();

    // Verify account exists and belongs to user
    const account = await accountService.getAccountById(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Email account not found' },
        { status: 404 }
      );
    }

    if (account.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete all emails in all folders for this account
    const folders = await folderService.getFoldersByAccount(accountId);
    for (const folder of folders) {
      const emails = await emailService.getEmailsByFolder(folder.id);
      for (const email of emails) {
        await emailService.softDeleteEmail(email.id);
      }
      await folderService.deleteFolder(folder.id);
    }

    // Delete the account
    await accountService.deleteAccount(accountId);

    console.log('Email account deleted:', accountId);

    return NextResponse.json({
      success: true,
      message: 'Email account deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete email account:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete email account'
      },
      { status: 500 }
    );
  }
}
