export interface FileInfo {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  thumbnailPath?: string;
  createdAt: string;
  uploader: {
    id: string;
    username: string;
    displayName?: string;
  };
}

export interface FileUploadProps {
  onUpload: (files: File[]) => void;
  maxSize: number;
  allowedTypes: string[];
  multiple?: boolean;
  disabled?: boolean;
}

export interface FilePreviewProps {
  file: FileInfo;
  onDownload: () => void;
  onDelete?: () => void;
}
