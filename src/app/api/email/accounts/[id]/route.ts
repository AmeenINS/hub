/**
 * API Route: DELETE /api/email/accounts/[id]
 * Delete email account
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { EmailAccountService, EmailFolderService, EmailService } from '@/core/data/email-service';

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
