import { FileRepository } from '../database/repositories/FileRepository';
import { UploadedFile, FileMetadata } from '../middleware/fileUpload';
import { SecurityService } from '../utils/security';
import { EncryptionService } from '../utils/encryption';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

export class FileService {
  /**
   * Handle file upload
   */
  static async uploadFile(
    messageId: string,
    uploadedFile: UploadedFile,
    userId: string
  ): Promise<FileMetadata> {
    // Validate file again (server-side validation)
    const validation = SecurityService.validateFileUpload({
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size,
      originalname: uploadedFile.originalname,
    });
    
    if (!validation.isValid) {
      // Clean up uploaded file if validation fails
      if (fs.existsSync(uploadedFile.path)) {
        fs.unlinkSync(uploadedFile.path);
      }
      
      throw new Error(validation.error || 'File validation failed');
    }
    
    // Generate thumbnail for images
    let thumbnailPath: string | undefined;
    if (uploadedFile.mimetype.startsWith('image/')) {
      thumbnailPath = await this.generateThumbnail(uploadedFile.path);
    }
    
    // Save file metadata to database
    const fileRecord = await FileRepository.create({
      messageId,
      fileName: uploadedFile.originalname,
      filePath: uploadedFile.path,
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.mimetype,
      thumbnailPath,
    });
    
    return {
      id: fileRecord.id,
      originalName: uploadedFile.originalname,
      fileName: uploadedFile.filename,
      filePath: uploadedFile.path,
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.mimetype,
      uploadedBy: userId,
      createdAt: new Date(fileRecord.created_at),
    };
  }
  
  /**
   * Get file metadata
   */
  static async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    const file = await FileRepository.findById(fileId);
    
    if (!file) {
      return null;
    }
    
    return {
      id: file.id,
      originalName: file.file_name,
      fileName: path.basename(file.file_path),
      filePath: file.file_path,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      uploadedBy: '', // Would be joined with message data
      createdAt: new Date(file.created_at),
    };
  }
  
  /**
   * Get file for download
   */
  static async getFileForDownload(fileId: string, userId: string): Promise<{
    file: FileMetadata | null;
    canAccess: boolean;
  }> {
    const file = await FileRepository.findById(fileId);
    
    if (!file) {
      return { file: null, canAccess: false };
    }
    
    // Check if user has access to the file (is in conversation)
    // This would require checking message and conversation participants
    const canAccess = await this.checkFileAccess(fileId, userId);
    
    const fileMetadata: FileMetadata = {
      id: file.id,
      originalName: file.file_name,
      fileName: path.basename(file.file_path),
      filePath: file.file_path,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      uploadedBy: '', // Would be populated from message sender
      createdAt: new Date(file.created_at),
    };
    
    return { file: fileMetadata, canAccess };
  }
  
  /**
   * Delete file
   */
  static async deleteFile(fileId: string, userId: string): Promise<boolean> {
    // Check if user has permission to delete (is message sender or admin)
    const hasPermission = await this.checkFileDeletePermission(fileId, userId);
    
    if (!hasPermission) {
      throw new Error('You do not have permission to delete this file');
    }
    
    return await FileRepository.delete(fileId);
  }
  
  /**
   * Generate thumbnail for image
   */
  private static async generateThumbnail(imagePath: string): Promise<string | undefined> {
    try {
      // For now, return undefined (thumbnail generation would require image processing library)
      // In a real implementation, you'd use sharp, jimp, or similar
      const thumbnailDir = path.join(config.upload.uploadPath, 'thumbnails');
      
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      
      const filename = path.basename(imagePath, path.extname(imagePath));
      const thumbnailPath = path.join(thumbnailDir, `${filename}_thumb.jpg`);
      
      // Placeholder for thumbnail generation
      // In reality, you'd use an image processing library here
      
      return undefined;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return undefined;
    }
  }
  
  /**
   * Check if user can access file
   */
  private static async checkFileAccess(fileId: string, userId: string): Promise<boolean> {
    // This would check if the user is a participant in the conversation
    // that contains the message with this attachment
    // For now, return true (implement proper access control)
    return true;
  }
  
  /**
   * Check if user can delete file
   */
  private static async checkFileDeletePermission(fileId: string, userId: string): Promise<boolean> {
    // This would check if the user sent the message or is conversation admin
    // For now, return true (implement proper permission checking)
    return true;
  }
  
  /**
   * Cleanup orphaned files
   */
  static async cleanupOrphanedFiles(): Promise<number> {
    return await FileRepository.cleanupOrphanedFiles();
  }
  
  /**
   * Get file stats
   */
  static async getFileStats(userId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }> {
    // This would return file usage statistics
    // For now, return placeholder data
    return {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {},
    };
  }
}