/**
 * Avatar API Route
 * Serves avatar images with fallback to default avatar
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Build path to avatar file
    const avatarPath = join(process.cwd(), 'public', 'avatars', filename);
    const defaultAvatarPath = join(process.cwd(), 'public', 'avatars', 'default.svg');
    
    // Check if the requested avatar exists, otherwise use default
    const filePath = existsSync(avatarPath) ? avatarPath : defaultAvatarPath;
    
    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type
    const extension = filePath.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
    };
    
    const contentType = contentTypeMap[extension || 'svg'] || 'image/svg+xml';
    
    // Return the image
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    });
  } catch (error) {
    console.error('Error serving avatar:', error);
    
    // If all else fails, return default avatar
    try {
      const defaultAvatarPath = join(process.cwd(), 'public', 'avatars', 'default.svg');
      const fileBuffer = await readFile(defaultAvatarPath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      return NextResponse.json(
        { success: false, message: 'Avatar not found' },
        { status: 404 }
      );
    }
  }
}
