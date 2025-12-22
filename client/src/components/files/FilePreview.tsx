import { useState } from 'react';
import {
  Download,
  Trash2,
  File as FileIcon,
  Image,
  Film,
  FileText,
  Eye,
} from 'lucide-react';
import { FilePreviewProps } from '../types/files';

export function FilePreview({ file, onDownload, onDelete }: FilePreviewProps) {
  const [imageError, setImageError] = useState(false);

  const getFileIcon = () => {
    if (file.mimeType.startsWith('image/'))
      return <Image size={48} className='text-gray-400' />;
    if (file.mimeType.startsWith('video/'))
      return <Film size={48} className='text-gray-400' />;
    if (file.mimeType.includes('pdf') || file.mimeType.includes('document'))
      return <FileText size={48} className='text-gray-400' />;
    return <FileIcon size={48} className='text-gray-400' />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');

  return (
    <div className='card p-4 hover:shadow-md transition-shadow'>
      {/* Preview/Thumbnail */}
      <div className='relative mb-4'>
        {isImage && file.thumbnailPath && !imageError ? (
          <img
            src={file.thumbnailPath}
            alt={file.fileName}
            className='w-full h-48 object-cover rounded-lg'
            onError={() => setImageError(true)}
          />
        ) : (
          <div className='w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center'>
            {getFileIcon()}
          </div>
        )}

        {(isImage || isVideo) && (
          <button
            onClick={() => {
              if (isImage) {
                window.open(file.filePath, '_blank');
              }
            }}
            className='absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity'
          >
            <Eye size={16} />
          </button>
        )}
      </div>

      {/* File Info */}
      <div className='space-y-2'>
        <h3
          className='font-medium text-gray-900 truncate'
          title={file.fileName}
        >
          {file.fileName}
        </h3>

        <div className='flex items-center justify-between text-sm text-gray-500'>
          <span>{formatFileSize(file.fileSize)}</span>
          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
        </div>

        <div className='flex items-center text-sm text-gray-600'>
          <span className='font-medium'>
            {file.uploader.displayName || file.uploader.username}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className='flex space-x-2 mt-4'>
        <button
          onClick={onDownload}
          className='btn btn-secondary flex-1 flex items-center justify-center'
        >
          <Download size={16} className='mr-2' />
          Download
        </button>

        {onDelete && (
          <button
            onClick={onDelete}
            className='p-2 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg'
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
