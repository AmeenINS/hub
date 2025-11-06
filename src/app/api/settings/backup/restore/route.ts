import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { JWTService } from '@/lib/auth/jwt';
import { checkPermission } from '@/lib/auth/middleware';

const execFileAsync = promisify(execFile);

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No backup file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name || `backup-${Date.now()}.tar.gz`;
    if (!fileName.endsWith('.tar.gz') && !fileName.endsWith('.tgz')) {
      return NextResponse.json(
        { success: false, error: 'Unsupported backup format. Please use a .tar.gz archive.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Backup file is empty' },
        { status: 400 }
      );
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hub-restore-'));
    const tempFilePath = path.join(tempDir, crypto.randomUUID() + path.extname(fileName));
    await fs.writeFile(tempFilePath, buffer);

    const timestamp = Date.now();
    const lmdbPath = path.join(DATA_DIR, 'lmdb');
    const uploadsPath = path.join(DATA_DIR, 'uploads');

    const backups: Array<{ original: string; backup: string }> = [];

    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });

      if (await pathExists(lmdbPath)) {
        const backupPath = `${lmdbPath}.bak-${timestamp}`;
        await fs.rename(lmdbPath, backupPath);
        backups.push({ original: lmdbPath, backup: backupPath });
      }

      if (await pathExists(uploadsPath)) {
        const backupPath = `${uploadsPath}.bak-${timestamp}`;
        await fs.rename(uploadsPath, backupPath);
        backups.push({ original: uploadsPath, backup: backupPath });
      }

      await execFileAsync('tar', ['-xzf', tempFilePath, '-C', process.cwd()]);

      for (const { backup } of backups) {
        await fs.rm(backup, { recursive: true, force: true });
      }

      // Best-effort cleanup of temp artifacts
      await fs.rm(tempDir, { recursive: true, force: true });

      return NextResponse.json({
        success: true,
        message: 'System restored successfully',
      });
    } catch (error) {
      console.error('Restore operation failed:', error);

      // Attempt to restore previous state if available
      for (const { original, backup } of backups) {
        try {
          await fs.rm(original, { recursive: true, force: true });
          await fs.rename(backup, original);
        } catch (restoreError) {
          console.error('Failed to restore original data after restore failure:', restoreError);
        }
      }

      return NextResponse.json(
        { success: false, error: 'Failed to restore backup' },
        { status: 500 }
      );
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Failed to clean temporary restore directory:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Unexpected restore error:', error);
    return NextResponse.json(
      { success: false, error: 'Restore failed due to an unexpected error' },
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
