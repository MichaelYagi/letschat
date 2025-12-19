import { Request, Response } from 'express';
import { FileService } from '../services/FileService';
import { uploadMiddleware, UploadedFile } from '../middleware/fileUpload';
import { authMiddleware } from '../config/jwt';

export class FileController {
  /**
   * Upload file(s)
   */
  static async uploadFiles(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const messageId = req.body.messageId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      if (!messageId) {
        res.status(400).json({
          success: false,
          error: 'Message ID is required',
        });
        return;
      }
      
      if (!req.files) {
        res.status(400).json({
          success: false,
          error: 'No files uploaded',
        });
        return;
      }
      
      const files = Array.isArray(req.files) 
        ? req.files as unknown as UploadedFile[]
        : [req.files as unknown as UploadedFile];
      
      const uploadedFiles = [];
      
      for (const file of files) {
        try {
          const fileMetadata = await FileService.uploadFile(
            messageId,
            file,
            userId
          );
          // @ts-ignore
          uploadedFiles.push(fileMetadata);
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
      
      if (uploadedFiles.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files were successfully uploaded',
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        data: {
          files: uploadedFiles,
          uploaded: uploadedFiles.length,
          total: files.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
      });
    }
  }
  
  /**
   * Download file
   */
  static async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const fileId = req.params.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const { file, canAccess } = await FileService.getFileForDownload(
        fileId,
        userId
      );
      
      if (!file || !canAccess) {
        res.status(404).json({
          success: false,
          error: 'File not found or access denied',
        });
        return;
      }
      
      const fs = require('fs');
      if (!fs.existsSync(file.filePath)) {
        res.status(404).json({
          success: false,
          error: 'File not found on server',
        });
        return;
      }
      
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.fileSize.toString());
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.originalName}"`
      );
      
      const fileStream = fs.createReadStream(file.filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', () => {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error serving file',
          });
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'File download failed',
      });
    }
  }
  
  /**
   * Get file metadata
   */
  static async getFileMetadata(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const fileId = req.params.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const { file, canAccess } = await FileService.getFileForDownload(
        fileId,
        userId
      );
      
      if (!file || !canAccess) {
        res.status(404).json({
          success: false,
          error: 'File not found or access denied',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: file,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file metadata',
      });
    }
  }
  
  /**
   * Delete file
   */
  static async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const fileId = req.params.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const deleted = await FileService.deleteFile(fileId, userId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'File not found or no permission to delete',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'File deletion failed',
      });
    }
  }
  
  /**
   * Get user file statistics
   */
  static async getFileStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }
      
      const stats = await FileService.getFileStats(userId);
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file stats',
      });
    }
  }
}