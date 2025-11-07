import { NextRequest } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { fileStorage, FileStorageManager, UploadedFile } from '@/core/storage/file-storage';
import { lmdb } from '@/core/data/lmdb';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  videos: ['video/mp4', 'video/webm', 'video/ogg'],
  all: [] // Empty means all types allowed
};

/**
 * Upload file endpoint
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string | null;
    const entityId = formData.get('entityId') as string | null;
    const allowedTypes = formData.get('allowedTypes') as string | null;
    const maxSize = parseInt(formData.get('maxSize') as string || String(MAX_FILE_SIZE));

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > maxSize) {
      return Response.json(
        { 
          error: 'File too large',
          maxSize: FileStorageManager.formatFileSize(maxSize),
          fileSize: FileStorageManager.formatFileSize(file.size)
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypesArray = allowedTypes ? JSON.parse(allowedTypes) : ALLOWED_FILE_TYPES.all;
    if (!FileStorageManager.isValidFileType(file.type, allowedTypesArray)) {
      return Response.json(
        { error: 'File type not allowed', allowedTypes: allowedTypesArray },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file
    const uploadedFile = await fileStorage.saveFile(
      buffer,
      file.name,
      file.type,
      payload.userId,
      entityType || undefined,
      entityId || undefined
    );

    // Store metadata in database
    await lmdb.create('files', uploadedFile.id, uploadedFile);

    console.log('✅ File uploaded successfully:', uploadedFile.fileName);

    return Response.json({
      success: true,
      file: uploadedFile
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

/**
 * Get uploaded files
 * GET /api/upload?entityType=user&entityId=123
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const userId = searchParams.get('userId');

    // Query files
    const allFiles = await lmdb.query('files', () => true) as UploadedFile[];
    
    let filteredFiles = allFiles;

    if (entityType && entityId) {
      filteredFiles = allFiles.filter(
        (f) => f.entityType === entityType && f.entityId === entityId
      );
    } else if (userId) {
      filteredFiles = allFiles.filter((f) => f.uploadedBy === userId);
    } else {
      // Return user's own files
      filteredFiles = allFiles.filter((f) => f.uploadedBy === payload.userId);
    }

    return Response.json({
      success: true,
      files: filteredFiles,
      count: filteredFiles.length
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Fetch failed' },
      { status: 500 }
    );
  }
}

/**
 * Delete file
 * DELETE /api/upload?id=file-id
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const fileId = searchParams.get('id');

    if (!fileId) {
      return Response.json({ error: 'File ID required' }, { status: 400 });
    }

    // Get file metadata
    const fileData = await lmdb.getById('files', fileId) as UploadedFile | null;
    if (!fileData) {
      return Response.json({ error: 'File not found' }, { status: 404 });
    }

    // Check ownership (only file owner can delete)
    if (fileData.uploadedBy !== payload.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete file from disk
    await fileStorage.deleteFile(fileData.filePath);

    // Delete metadata from database
    await lmdb.delete('files', fileId);

    console.log('✅ File deleted successfully:', fileId);

    return Response.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
