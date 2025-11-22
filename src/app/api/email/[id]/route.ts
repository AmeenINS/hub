/**
 * Single Email API
 * GET/PUT/DELETE - Email operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmailService, EmailAccountService, EmailFolderService } from '@/core/data/email-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const emailService = new EmailService();
    const email = await emailService.getEmailById(id);

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 });
    }

    // Verify email belongs to user's account
    const folderService = new EmailFolderService();
    const folder = await folderService.getFolderById(email.folderId);
    if (!folder) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const accountService = new EmailAccountService();
    const account = await accountService.getAccountById(folder.accountId);
    if (!account || account.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: email
    });
  } catch (error) {
    logError('GET /api/email/[id]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const emailService = new EmailService();
    
    // Verify email exists and belongs to user
    const existingEmail = await emailService.getEmailById(id);
    if (!existingEmail) {
      return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 });
    }

    const folderService = new EmailFolderService();
    const folder = await folderService.getFolderById(existingEmail.folderId);
    if (!folder) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const accountService = new EmailAccountService();
    const account = await accountService.getAccountById(folder.accountId);
    if (!account || account.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const email = await emailService.updateEmail(id, body);

    return NextResponse.json({
      success: true,
      data: email,
      message: 'Email updated successfully'
    });
  } catch (error) {
    logError('PUT /api/email/[id]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const hasPermission = await checkPermission(payload.userId, 'email', 'delete');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const emailService = new EmailService();
    
    // Verify email exists and belongs to user
    const email = await emailService.getEmailById(id);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 });
    }

    const folderService = new EmailFolderService();
    const folder = await folderService.getFolderById(email.folderId);
    if (!folder) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const accountService = new EmailAccountService();
    const account = await accountService.getAccountById(folder.accountId);
    if (!account || account.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const success = await emailService.softDeleteEmail(id);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email deleted successfully'
    });
  } catch (error) {
    logError('DELETE /api/email/[id]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
