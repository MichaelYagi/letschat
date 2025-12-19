import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { authMiddleware } from '../config/jwt';
import { uploadMiddleware } from '../middleware/fileUpload';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Upload files (multiple files support)
router.post('/upload', 
  uploadMiddleware.array('files', 10), 
  FileController.uploadFiles
);

// Download file
router.get('/download/:id', FileController.downloadFile);

// Get file metadata
router.get('/:id', FileController.getFileMetadata);

// Delete file
router.delete('/:id', FileController.deleteFile);

// Get file statistics
router.get('/stats/me', FileController.getFileStats);

export default router;