/**
 * Send Email API
 * POST - Send new email
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmailService, EmailAccountService, EmailFolderService } from '@/core/data/email-service';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';
import { logError } from '@/core/logging/logger';
import { EmailPriority, EmailFolderType } from '@/shared/types/database';
import { SmtpEmailService } from '@/core/email/smtp-service';

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

    const hasPermission = await checkPermission(payload.userId, 'email', 'send');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { accountId, to, cc, bcc, subject, body: emailBody, bodyHtml, priority, inReplyTo } = body;

    const accountService = new EmailAccountService();
    const account = await accountService.getAccountById(accountId);
    
    if (!account || account.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Invalid account' }, { status: 400 });
    }

    // Get SENT folder
    const folderService = new EmailFolderService();
    const sentFolder = await folderService.getFolderByType(accountId, EmailFolderType.SENT);
    
    if (!sentFolder) {
      return NextResponse.json({ success: false, error: 'Sent folder not found' }, { status: 400 });
    }

    console.log('[EMAIL SEND] Sending email from:', account.email);
    console.log('[EMAIL SEND] SMTP Config:', {
      host: account.smtpHost,
      port: account.smtpPort,
      username: account.smtpUsername,
      ssl: account.smtpUseSsl,
      hasPassword: !!account.smtpPassword,
      passwordLength: account.smtpPassword?.length || 0
    });

    // Send email via SMTP
    const smtpService = new SmtpEmailService();
    const sendResult = await smtpService.sendEmailWithSignature(account, {
      from: account.email,
      to: Array.isArray(to) ? to : [to],
      cc,
      bcc,
      subject,
      text: emailBody,
      html: bodyHtml,
      inReplyTo
    });

    if (!sendResult.success) {
      console.error('[EMAIL SEND] Failed:', sendResult.error);
      return NextResponse.json(
        { success: false, error: sendResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }
    
    console.log('[EMAIL SEND] Email sent successfully, messageId:', sendResult.messageId);
    
    // Save to sent folder
    const emailService = new EmailService();
    const email = await emailService.createEmail({
      accountId,
      folderId: sentFolder.id,
      from: account.email,
      to: Array.isArray(to) ? to : [to],
      cc,
      bcc,
      subject,
      body: emailBody,
      bodyHtml,
      bodyText: emailBody,
      priority: priority || EmailPriority.NORMAL,
      isRead: true,
      isStarred: false,
      isFlagged: false,
      isDraft: false,
      hasAttachments: false,
      sentAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      inReplyTo,
      messageId: sendResult.messageId
    });

    return NextResponse.json({
      success: true,
      data: email,
      message: 'Email sent successfully via SMTP'
    }, { status: 201 });
  } catch (error) {
    logError('POST /api/email/send', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
