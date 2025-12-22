import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X, File } from 'lucide-react';
import { filesApi } from '../../services/api';
import { conversationsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface MessageInputProps {
  conversationId?: string;
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  conversationId,
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Emit typing status
    if (newMessage.trim().length > 0) {
      onTyping(true);
    } else {
      onTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      onTyping(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    setUploadingFile(true);
    setShowFileUpload(false);

    try {
      // Upload file
      const response = await filesApi.uploadFile(file, conversationId);

      // Send message about the file
      const fileMessage = `Shared a file: ${file.name}`;
      await conversationsApi.sendMessage(conversationId, {
        content: fileMessage,
        contentType: 'file',
      });
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className='border-t border-gray-200 bg-white p-4'
      >
        <div className='flex items-end space-x-2'>
          <button
            type='button'
            onClick={() => setShowFileUpload(true)}
            className='p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full'
            disabled={disabled || !conversationId}
            title='Attach file'
          >
            {uploadingFile ? (
              <div className='animate-spin'>
                <File size={20} />
              </div>
            ) : (
              <Paperclip size={20} />
            )}
          </button>

          <div className='flex-1 relative'>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none overflow-hidden'
              style={{ minHeight: '40px', maxHeight: '120px' }}
              rows={1}
            />
          </div>

          <button
            type='button'
            className='p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full'
            disabled={disabled}
            title='Emoji (coming soon)'
          >
            <Smile size={20} />
          </button>

          <button
            type='submit'
            disabled={!message.trim() || disabled}
            className='p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        onChange={handleFileSelect}
        className='hidden'
        accept='image/*,video/*,.pdf,.doc,.docx,.txt,.csv'
      />

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-md mx-4'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Attach File
              </h3>
              <button
                onClick={() => setShowFileUpload(false)}
                className='text-gray-400 hover:text-gray-600 focus:outline-none'
              >
                <X size={20} />
              </button>
            </div>

            <div className='p-4'>
              <input
                ref={fileInputRef}
                type='file'
                onChange={handleFileSelect}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                accept='image/*,video/*,.pdf,.doc,.docx,.txt,.csv'
              />
              <p className='text-sm text-gray-500 mt-2'>
                Accepted formats: Images, videos, PDF, Word, text files
              </p>
              <p className='text-sm text-gray-500'>Maximum file size: 10MB</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
