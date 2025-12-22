import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { SecurityService } from '../utils/security';
import { EncryptionService } from '../utils/encryption';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = config.upload.uploadPath;

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Create subdirectories by file type
    let subfolder = 'others';
    if (file.mimetype.startsWith('image/')) {
      subfolder = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subfolder = 'videos';
    } else if (
      file.mimetype.includes('document') ||
      file.mimetype.includes('pdf')
    ) {
      subfolder = 'documents';
    }

    const folderPath = path.join(uploadPath, subfolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    // Generate secure filename
    const secureName = SecurityService.generateSecureFilename(
      file.originalname
    );
    cb(null, secureName);
  },
});

// File filter for validation
const fileFilter = (req: any, file: any, cb: any) => {
  try {
    const validation = SecurityService.validateFileUpload(file);

    if (!validation.isValid) {
      return cb(new Error(validation.error || 'Invalid file'), false);
    }

    cb(null, true);
  } catch (error) {
    cb(error as Error, false);
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 10, // Maximum 10 files per request
  },
});

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: Date;
}
