import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/db/notification-service';
import { JWTService } from '@/lib/auth/jwt';

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

    const notificationService = new NotificationService();
    const unreadNotifications = await notificationService.getUnreadNotifications(payload.userId);
    
    return NextResponse.json({ count: unreadNotifications.length });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}