import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { SupportService } from '@/core/data/support-service';
import { AdvancedPermissionService } from '@/core/auth/advanced-permission-service';
import { PermissionLevel } from '@/core/auth/permission-levels';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Permission check: require at least READ level for support module
    const hasAccess = await AdvancedPermissionService.hasMinimumLevel(payload.userId, 'support', PermissionLevel.READ);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supportService = new SupportService();
    const messages = await supportService.getUserMessages(payload.userId);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching support messages:', error);
    return NextResponse.json({ error: 'Failed to fetch support messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Permission check: require at least WRITE level for creating support messages
    const canCreate = await AdvancedPermissionService.hasMinimumLevel(payload.userId, 'support', PermissionLevel.WRITE);
    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supportService = new SupportService();
    const supportMessage = await supportService.createMessage({
      userId: payload.userId,
      subject,
      message,
    });

    return NextResponse.json(supportMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating support message:', error);
    return NextResponse.json({ error: 'Failed to create support message' }, { status: 500 });
  }
}
