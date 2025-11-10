import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

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

    const hasPermission = await checkPermission(payload.userId, 'settings', 'update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileNameParam = searchParams.get('file');

    if (!fileNameParam) {
      return NextResponse.json(
        { success: false, error: 'Missing file parameter' },
        { status: 400 }
      );
    }

    const safeFileName = path.basename(fileNameParam);
    if (safeFileName !== fileNameParam) {
      return NextResponse.json(
        { success: false, error: 'Invalid file name' },
        { status: 400 }
      );
    }

    const filePath = path.join(BACKUP_DIR, safeFileName);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download backup' },
      { status: 500 }
    );
  }
}
