import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/auth/jwt';
import { getUserModulePermissions } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get modules from query params
    const { searchParams } = new URL(request.url);
    const modulesParam = searchParams.get('modules');
    
    if (!modulesParam) {
      return NextResponse.json({ success: false, error: 'Modules parameter required' }, { status: 400 });
    }

    const modules = modulesParam.split(',');
    const permissions = await getUserModulePermissions(payload.userId, modules);

    console.log(`=== Permissions API ===`);
    console.log(`User ID: ${payload.userId}`);
    console.log(`Modules: ${modules.join(', ')}`);
    console.log(`Permissions:`, permissions);

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json({ success: false, error: 'Failed to check permissions' }, { status: 500 });
  }
}
