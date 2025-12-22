const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, '..', 'data', 'uploads');
const thumbnailsDir = path.join(__dirname, '..', 'data', 'thumbnails');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    // Other common formats
    'application/json',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only one file at a time
  },
});

// Helper function to create thumbnails for images
async function createThumbnail(filePath, outputPath) {
  try {
    // Try to use sharp if available
    const sharp = require('sharp');
    await sharp(filePath)
      .resize(200, 200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.warn(
      'Sharp not available, skipping thumbnail creation:',
      error.message
    );
    return false;
  }
}

// Helper function to get file info
function getFileInfo(file) {
  const stats = fs.statSync(file.path);
  return {
    id: uuidv4(),
    originalFilename: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    fileSize: stats.size,
    filePath: file.path,
    uploadsPath: `/uploads/${file.filename}`,
    thumbnailPath: file.mimetype.startsWith('image/')
      ? `/thumbnails/${file.filename}`
      : null,
    createdAt: new Date().toISOString(),
  };
}

// Clean up files on server shutdown
process.on('SIGINT', () => {
  console.log('Cleaning up temporary files...');
  // In production, you might want to keep files
  // For now, we'll just log
  process.exit(0);
});

module.exports = {
  upload,
  getFileInfo,
  createThumbnail,
  uploadsDir,
  thumbnailsDir,
};
