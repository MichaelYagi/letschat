import db from '../connection';
import fs from 'fs';
import { FileMetadata } from '../../middleware/fileUpload';
import { EncryptionService } from '../../utils/encryption';

export class FileRepository {
  /**
   * Save file metadata to database
   */
  static async create(fileData: {
    messageId: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    thumbnailPath?: string;
  }): Promise<any> {
    const fileId = EncryptionService.generateUUID();

    const [file] = await db('message_attachments')
      .insert({
        id: fileId,
        message_id: fileData.messageId,
        file_name: fileData.fileName,
        file_path: fileData.filePath,
        file_size: fileData.fileSize,
        mime_type: fileData.mimeType,
        thumbnail_path: fileData.thumbnailPath,
        created_at: new Date(),
      })
      .returning('*');

    return file;
  }

  /**
   * Get file metadata by ID
   */
  static async findById(id: string): Promise<any | null> {
    const file = await db('message_attachments').where('id', id).first();

    return file;
  }

  /**
   * Get files for message
   */
  static async getByMessageId(messageId: string): Promise<any[]> {
    const files = await db('message_attachments')
      .where('message_id', messageId)
      .orderBy('created_at', 'asc');

    return files;
  }

  /**
   * Delete file metadata and physical file
   */
  static async delete(id: string): Promise<boolean> {
    const file = await this.findById(id);

    if (file) {
      // Delete physical file
      try {
        if (fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
        }

        // Delete thumbnail if exists
        if (file.thumbnail_path && fs.existsSync(file.thumbnail_path)) {
          fs.unlinkSync(file.thumbnail_path);
        }
      } catch (error) {
        console.error('Error deleting physical files:', error);
      }

      // Delete database record
      const deletedCount = await db('message_attachments')
        .where('id', id)
        .del();

      return deletedCount > 0;
    }

    return false;
  }

  /**
   * Cleanup orphaned files
   */
  static async cleanupOrphanedFiles(): Promise<number> {
    // This would find files not associated with any message and delete them
    // For now, return 0
    return 0;
  }
}
