/**
 * SMTP Service - Email Sending
 * Sends emails via SMTP using nodemailer
 */

import nodemailer, { Transporter } from 'nodemailer';
import { EmailAccount } from '@/shared/types/database';

interface SendEmailParams {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  replyTo?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SmtpEmailService {
  /**
   * Create SMTP transporter
   */
  private createTransporter(account: EmailAccount): Transporter {
    return nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpUseSsl, // true for 465, false for other ports
      auth: {
        user: account.smtpUsername,
        pass: account.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
    });
  }

  /**
   * Send email via SMTP
   */
  async sendEmail(account: EmailAccount, params: SendEmailParams): Promise<SendResult> {
    try {
      console.log('[SMTP] Creating transporter for:', account.smtpHost + ':' + account.smtpPort);
      console.log('[SMTP] Username:', account.smtpUsername, 'SSL:', account.smtpUseSsl);
      
      const transporter = this.createTransporter(account);

      const mailOptions = {
        from: `${account.displayName || account.email} <${account.email}>`,
        to: params.to.join(', '),
        cc: params.cc?.join(', '),
        bcc: params.bcc?.join(', '),
        subject: params.subject,
        text: params.text,
        html: params.html || params.text,
        replyTo: params.replyTo || account.email,
        inReplyTo: params.inReplyTo,
      };

      console.log('[SMTP] Sending email to:', params.to.join(', '));
      const info = await transporter.sendMail(mailOptions);
      console.log('[SMTP] Email sent successfully, messageId:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('[SMTP] Error occurred:', error.message);
      console.error('[SMTP] Error code:', error.code);
      console.error('[SMTP] Full error:', error);
      
      let errorMessage = error.message || 'Failed to send email';
      
      // Provide helpful error messages
      if (errorMessage.includes('Unexpected socket close') || error.code === 'ECONNRESET') {
        errorMessage = 'Connection closed unexpectedly. This usually means: 1) Wrong SMTP port or SSL settings, 2) Invalid credentials (use App Password), 3) SMTP access not enabled.';
      } else if (errorMessage.includes('Authentication failed') || errorMessage.includes('Invalid credentials')) {
        errorMessage = 'SMTP Authentication failed. Please use an App Password (not your regular password) for Gmail/Zoho.';
      } else if (errorMessage.includes('ENOTFOUND')) {
        errorMessage = 'SMTP server not found. Please check the server address.';
      } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
        errorMessage = 'SMTP connection timeout. Check server address, port, and firewall settings.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Test SMTP connection
   */
  async testConnection(account: EmailAccount): Promise<boolean> {
    try {
      const transporter = this.createTransporter(account);
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }

  /**
   * Send email with signature
   */
  async sendEmailWithSignature(
    account: EmailAccount,
    params: SendEmailParams
  ): Promise<SendResult> {
    // Add signature if exists
    if (account.signature) {
      const signatureHtml = `<br><br><div class="signature">${account.signature.replace(/\n/g, '<br>')}</div>`;
      const signatureText = `\n\n${account.signature}`;
      
      params.html = (params.html || params.text) + signatureHtml;
      params.text = params.text + signatureText;
    }

    return this.sendEmail(account, params);
  }
}
