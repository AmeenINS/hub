import { NextRequest } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { fileStorage, UploadedFile } from '@/core/storage/file-storage';
import { lmdb } from '@/core/data/lmdb';

/**
 * Serve uploaded files
 * GET /api/files/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;

    // Get file metadata from database
    const fileData = await lmdb.getById('files', fileId) as UploadedFile | null;
    if (!fileData) {
      return new Response('File not found', { status: 404 });
    }

    // For images, allow public access (no authentication required)
    // For other files, require authentication
    if (!fileData.mimeType.startsWith('image/')) {
      const token = request.cookies.get('token')?.value;
      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }

      const payload = JWTService.verifyToken(token);
      if (!payload) {
        return new Response('Invalid token', { status: 401 });
      }
    }

    // Get file buffer (Node Buffer)
    const fileBuffer = await fileStorage.getFile(fileId, fileData);

    // Convert Node Buffer to ArrayBuffer slice to avoid SharedArrayBuffer typing issues
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

    // Return file with appropriate headers
    const body = arrayBuffer as ArrayBuffer;
    return new Response(body, {
      headers: {
        'Content-Type': fileData.mimeType,
        'Content-Length': String(fileData.size),
        'Content-Disposition': `inline; filename="${fileData.originalName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
