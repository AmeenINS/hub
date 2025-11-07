import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/core/auth/jwt';

export async function PUT(request: NextRequest) {
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
    const { emailNotifications, pushNotifications, taskNotifications } = body;

    // Store settings (you might want to extend User type to include these settings)
    // For now, we'll just return success
    // In production, you'd update the user record with these settings

    return NextResponse.json({ 
      success: true,
      settings: {
        emailNotifications,
        pushNotifications,
        taskNotifications,
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
