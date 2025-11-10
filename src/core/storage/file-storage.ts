import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';

export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  entityType?: string; // 'user', 'contact', 'task', etc.
  entityId?: string;
  createdAt: string;
}

export class FileStorageManager {
  private static instance: FileStorageManager;
  private uploadDir: string;

  private constructor() {
    // Store files in data/uploads (outside public for security)
    this.uploadDir = path.join(process.cwd(), 'data', 'uploads');
    this.ensureUploadDirectory();
  }

  static getInstance(): FileStorageManager {
    if (!FileStorageManager.instance) {
      FileStorageManager.instance = new FileStorageManager();
    }
    return FileStorageManager.instance;
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log('✅ Upload directory created:', this.uploadDir);
    }

    // Create subdirectories for different file types
    const subdirs = ['images', 'documents', 'videos', 'others'];
    subdirs.forEach(dir => {
      const dirPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  /**
   * Generate unique filename
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    return `${timestamp}_${random}_${sanitizedName}${ext}`;
  }

  /**
   * Determine file category based on MIME type
   */
  private getFileCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return 'documents';
    }
    return 'others';
  }

  /**
   * Save uploaded file
   */
  async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    uploadedBy: string,
    entityType?: string,
    entityId?: string
  ): Promise<UploadedFile> {
    const category = this.getFileCategory(mimeType);
    const fileName = this.generateFileName(originalName);
    // If uploadedBy is provided, store files inside a per-user folder for organization
    const userFolder = uploadedBy ? path.join(String(uploadedBy)) : '';
    const filePath = path.join(this.uploadDir, userFolder, category, fileName);
    const fileId = crypto.randomUUID();

    // Save file to disk
  // Ensure destination directory exists (handles per-user folders)
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
  await fsPromises.writeFile(filePath, fileBuffer);

    const uploadedFile: UploadedFile = {
      id: fileId,
      originalName,
      fileName,
      filePath,
      // fileUrl points to the secure file-serving endpoint
      fileUrl: `/api/files/${fileId}`,
      mimeType,
      size: fileBuffer.length,
      uploadedBy,
      entityType,
      entityId,
      createdAt: new Date().toISOString()
    };

    console.log('✅ File saved successfully:', fileName);
    return uploadedFile;
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string, fileData: UploadedFile): Promise<Buffer> {
    let filePath = fileData.filePath;
    
    // Check if file exists at the stored path
    if (!fs.existsSync(filePath)) {
      // Try alternative paths if the file was moved or the structure changed
      const fileName = path.basename(filePath);
      const category = this.getFileCategory(fileData.mimeType);
      
      // Try paths in order of likelihood:
      // 1. New structure: /app/data/uploads/{userId}/{category}/{filename}
      // 2. Old structure: /app/data/uploads/{category}/{filename}
      // 3. Direct in uploads: /app/data/uploads/{filename}
      
      const alternatePaths = [
        path.join(this.uploadDir, fileData.uploadedBy, category, fileName),
        path.join(this.uploadDir, category, fileName),
        path.join(this.uploadDir, fileName)
      ];
      
      for (const altPath of alternatePaths) {
        if (fs.existsSync(altPath)) {
          filePath = altPath;
          console.log(`✅ Found file at alternative path: ${altPath}`);
          break;
        }
      }
      
      // If still not found, throw error
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${fileData.filePath}`);
        console.error(`   Tried paths:`, [fileData.filePath, ...alternatePaths]);
        throw new Error('File not found on disk');
      }
    }

    return await fsPromises.readFile(filePath);
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
      console.log('✅ File deleted:', filePath);
    }
  }

  /**
   * Get file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Validate file type
   */
  static isValidFileType(mimeType: string, allowedTypes?: string[]): boolean {
    if (!allowedTypes || allowedTypes.length === 0) return true;
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return mimeType.startsWith(category + '/');
      }
      return mimeType === type;
    });
  }

  /**
   * Validate file size
   */
  static isValidFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }
}

export const fileStorage = FileStorageManager.getInstance();
