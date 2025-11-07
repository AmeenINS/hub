import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';

const execFileAsync = promisify(execFile);

interface AuthResult {
  userId: string;
}

interface BackupInfo {
  fileName: string;
  size: number;
  sizeLabel: string;
  createdAt: string;
  downloadUrl: string;
}

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');
const DATA_DIR = path.join(process.cwd(), 'data');

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value > 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

async function ensureAuthorized(request: NextRequest): Promise<AuthResult | NextResponse> {
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

    return { userId: payload.userId };
  } catch (error) {
    console.error('Backup auth check failed:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

async function getBackupList(): Promise<BackupInfo[]> {
  try {
    const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });
    const backups: BackupInfo[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.tar.gz') && !entry.name.endsWith('.tgz')) continue;

      const filePath = path.join(BACKUP_DIR, entry.name);
      const stats = await fs.stat(filePath);

      backups.push({
        fileName: entry.name,
        size: stats.size,
        sizeLabel: formatFileSize(stats.size),
        createdAt: stats.mtime.toISOString(),
        downloadUrl: `/api/settings/backup/download?file=${encodeURIComponent(entry.name)}`,
      });
    }

    return backups.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error('Failed to read backups directory:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const auth = await ensureAuthorized(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const backups = await getBackupList();
    return NextResponse.json({
      success: true,
      data: { backups },
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await ensureAuthorized(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const lmdbPath = path.join(DATA_DIR, 'lmdb');
    const uploadsPath = path.join(DATA_DIR, 'uploads');

    const sources: string[] = [];
    if (await pathExists(lmdbPath)) {
      sources.push(asTarPath(path.relative(process.cwd(), lmdbPath)));
    }
    if (await pathExists(uploadsPath)) {
      sources.push(asTarPath(path.relative(process.cwd(), uploadsPath)));
    }

    if (sources.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data directories found to backup' },
        { status: 400 }
      );
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '-')
      .split('.')[0];
    const backupFileName = `backup-${timestamp}.tar.gz`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    const args = ['-czf', backupPath, ...sources];

    await execFileAsync('tar', args, { cwd: process.cwd() });

    const stats = await fs.stat(backupPath);

    const backupInfo: BackupInfo = {
      fileName: backupFileName,
      size: stats.size,
      sizeLabel: formatFileSize(stats.size),
      createdAt: stats.mtime.toISOString(),
      downloadUrl: `/api/settings/backup/download?file=${encodeURIComponent(backupFileName)}`,
    };

    return NextResponse.json({
      success: true,
      data: {
        backup: backupInfo,
      },
      message: 'Backup created successfully',
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function asTarPath(relativePath: string): string {
  return relativePath.split(path.sep).join('/');
}
