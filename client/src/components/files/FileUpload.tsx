import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  File as FileIcon,
  Image,
  Film,
  FileText,
} from 'lucide-react';
import { FileUploadProps } from '@/types/files';

export function FileUpload({
  onUpload,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = [
    'image/*',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  multiple = false,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`;
      }

      const isAllowedType = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -2));
        }
        return file.type === type;
      });

      if (!isAllowedType) {
        return `File "${file.name}" is not a supported type`;
      }

      return null;
    },
    [maxSize, allowedTypes]
  );

  const handleFiles = useCallback(
    (files: FileList) => {
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      Array.from(files).forEach(file => {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      setErrors(newErrors);

      if (validFiles.length > 0) {
        const filesToUpload = multiple
          ? [...selectedFiles, ...validFiles]
          : validFiles;
        setSelectedFiles(filesToUpload);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [multiple, selectedFiles, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!disabled) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
    },
    [selectedFiles]
  );

  const handleUpload = useCallback(() => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
      setErrors([]);
    }
  }, [selectedFiles, onUpload]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image size={24} />;
    if (file.type.startsWith('video/')) return <Film size={24} />;
    if (file.type.includes('pdf') || file.type.includes('document'))
      return <FileText size={24} />;
    return <FileIcon size={24} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className='space-y-4'>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload size={48} className='mx-auto mb-4 text-gray-400' />
        <div className='text-gray-600 mb-2'>
          <p className='text-lg font-medium'>
            Drop files here or click to browse
          </p>
          <p className='text-sm'>
            Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
          <p className='text-xs text-gray-500'>
            Supported formats: Images, PDF, Text, Word documents
          </p>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          multiple={multiple}
          accept={allowedTypes.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className='hidden'
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className='space-y-2'>
          {errors.map((error, index) => (
            <div
              key={index}
              className='bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm'
            >
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className='space-y-2'>
          <h3 className='text-sm font-medium text-gray-900'>Selected Files:</h3>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
            >
              <div className='flex items-center space-x-3'>
                <div className='text-gray-400'>{getFileIcon(file)}</div>
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    {file.name}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className='text-gray-400 hover:text-red-500 focus:outline-none'
                disabled={disabled}
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={disabled || errors.length > 0}
          className='btn btn-primary w-full'
        >
          Upload {selectedFiles.length} file
          {selectedFiles.length !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
