import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/core/data/notification-service';
import { JWTService } from '@/core/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const notificationService = new NotificationService();
    const unreadNotifications = await notificationService.getUnreadNotifications(payload.userId);
    
    return NextResponse.json({ success: true, data: { count: unreadNotifications.length } });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch unread count' }, { status: 500 });
  }
}