import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { JWTService } from '@/core/auth/jwt';
import { checkPermission } from '@/core/auth/middleware';

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

    // Clean up old backup directories before starting (older than 24 hours)
    try {
      const dataContents = await fs.readdir(DATA_DIR);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      for (const item of dataContents) {
        if (item.endsWith('.bak-' + item.split('.bak-')[1]) && item.includes('.bak-')) {
          const backupTimestamp = parseInt(item.split('.bak-')[1]);
          if (!isNaN(backupTimestamp) && (now - backupTimestamp) > twentyFourHours) {
            const oldBackupPath = path.join(DATA_DIR, item);
            console.log(`🧹 Removing old backup: ${item}`);
            await fs.rm(oldBackupPath, { recursive: true, force: true }).catch(err => 
              console.warn(`⚠️ Could not remove old backup ${item}:`, err.message)
            );
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not cleanup old backups:', err);
    }

    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });

      // Backup LMDB database - skip if busy, tar will overwrite
      if (await pathExists(lmdbPath)) {
        const backupPath = `${lmdbPath}.bak-${timestamp}`;
        try {
          await fs.rename(lmdbPath, backupPath);
          backups.push({ original: lmdbPath, backup: backupPath });
          console.log('✅ Backed up LMDB database via rename');
        } catch (err) {
          const error = err as NodeJS.ErrnoException;
          if (error.code === 'EBUSY') {
            // If busy, just copy for backup - tar will extract over existing
            console.log('📋 LMDB database busy, creating backup copy...');
            await fs.cp(lmdbPath, backupPath, { recursive: true });
            backups.push({ original: lmdbPath, backup: backupPath });
            console.log('✅ Backup copy created, will extract over existing files');
            // Don't try to delete - let tar overwrite
          } else {
            throw err;
          }
        }
      }

      // Backup uploads directory - skip if busy, tar will overwrite
      if (await pathExists(uploadsPath)) {
        const backupPath = `${uploadsPath}.bak-${timestamp}`;
        try {
          await fs.rename(uploadsPath, backupPath);
          backups.push({ original: uploadsPath, backup: backupPath });
          console.log('✅ Backed up uploads directory via rename');
        } catch (err) {
          const error = err as NodeJS.ErrnoException;
          if (error.code === 'EBUSY') {
            // If busy, just copy for backup - tar will extract over existing
            console.log('📋 Uploads directory busy, creating backup copy...');
            await fs.cp(uploadsPath, backupPath, { recursive: true });
            backups.push({ original: uploadsPath, backup: backupPath });
            console.log('✅ Backup copy created, will extract over existing files');
            // Don't try to delete - let tar overwrite
          } else {
            throw err;
          }
        }
      }

      // Extract backup - will overwrite existing files
      console.log('📦 Extracting backup archive...');
      await execFileAsync('tar', ['-xzf', tempFilePath, '-C', process.cwd()]);

      // Remove backup directories - best effort, don't fail if it can't delete
      console.log('🧹 Cleaning up backup directories...');
      for (const { backup } of backups) {
        try {
          await fs.rm(backup, { recursive: true, force: true, maxRetries: 3 });
          console.log(`✅ Removed backup: ${backup}`);
        } catch (err) {
          console.warn(`⚠️ Failed to remove backup ${backup}, will continue anyway:`, err);
          // Don't fail the restore if cleanup fails - these will be cleaned up next time
        }
      }

      // Best-effort cleanup of temp artifacts
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.warn('⚠️ Failed to cleanup temp directory:', err);
      }

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
