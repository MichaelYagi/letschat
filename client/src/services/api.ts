import axios from 'axios';
import { LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('letschat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and create better error messages
api.interceptors.response.use(
  response => response,
  error => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message =
          'Request timeout. Please check your connection and try again.';
      } else if (error.message === 'Network Error') {
        error.message = 'Network error. Please check your internet connection.';
      } else {
        error.message = 'An unexpected error occurred. Please try again.';
      }
    } else {
      // Handle API errors with custom messages
      const { status, data } = error.response;

      switch (status) {
        case 401:
          localStorage.removeItem('letschat_token');
          window.location.href = '/login';
          break;
        case 403:
          error.message = 'You do not have permission to perform this action.';
          break;
        case 404:
          error.message = 'The requested resource was not found.';
          break;
        case 422:
          error.message = data?.error?.message || 'Invalid data provided.';
          break;
        case 429:
          error.message = 'Too many requests. Please try again later.';
          break;
        case 500:
          error.message = 'Server error. Please try again later.';
          break;
        default:
          error.message =
            data?.error?.message || error.message || 'An error occurred.';
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const { user, tokens } = response.data.data || response.data;
    localStorage.setItem('letschat_token', tokens.accessToken);
    return { user, token: tokens.accessToken };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    const { user, tokens } = response.data.data || response.data;
    localStorage.setItem('letschat_token', tokens.accessToken);
    return { user, token: tokens.accessToken };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('letschat_token');
    }
  },

  async getProfile(): Promise<any> {
    const response = await api.get('/v1/users/profile');
    return response.data.data;
  },

  async updateProfile(data: Partial<any>): Promise<any> {
    const response = await api.put('/v1/users/profile', data);
    return response.data.data;
  },
};

export const conversationsApi = {
  async getConversations(): Promise<any> {
    const response = await api.get('/v1/conversations');
    return response.data.data;
  },

  async createConversation(data: any): Promise<any> {
    const response = await api.post('/v1/conversations', data);
    return response.data.data;
  },

  async getConversation(conversationId: string): Promise<any> {
    const response = await api.get(`/v1/conversations/${conversationId}`);
    return response.data.data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/v1/conversations/${conversationId}`);
  },

  async addParticipant(conversationId: string, userId: string): Promise<void> {
    await api.post(`/v1/conversations/${conversationId}/participants`, {
      userId,
    });
  },

  async removeParticipant(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await api.delete(
      `/v1/conversations/${conversationId}/participants/${userId}`
    );
  },
};

export const messagesApi = {
  async getMessages(conversationId: string, params?: any): Promise<any> {
    const response = await api.get(
      `/v1/conversations/${conversationId}/messages`,
      { params }
    );
    return response.data.data;
  },

  async sendMessage(conversationId: string, data: any): Promise<any> {
    const response = await api.post(
      `/v1/conversations/${conversationId}/messages`,
      data
    );
    return response.data.data;
  },

  async editMessage(messageId: string, content: string): Promise<any> {
    const response = await api.put(`/v1/messages/${messageId}`, { content });
    return response.data.data;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/v1/messages/${messageId}`);
  },

  async addReaction(messageId: string, emoji: string): Promise<void> {
    await api.post(`/v1/messages/${messageId}/reactions`, { emoji });
  },

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await api.delete(`/v1/messages/${messageId}/reactions/${emoji}`);
  },

  async searchMessages(query: string, conversationId?: string): Promise<any> {
    const params = { query, ...(conversationId && { conversationId }) };
    const response = await api.get('/v1/messages/search', { params });
    return response.data.data;
  },
};

export const filesApi = {
  async uploadFile(file: File, conversationId: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    try {
      const response = await api.post('/v1/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file uploads
      });
      return response.data.data;
    } catch (error: any) {
      // Handle file upload specific errors
      if (error.code === 'ECONNABORTED') {
        throw new Error(
          'File upload timed out. Please try with a smaller file or check your connection.'
        );
      }
      if (error.response?.status === 413) {
        throw new Error('File is too large. Maximum size is 10MB.');
      }
      if (
        error.response?.status === 400 &&
        error.message?.includes('File type')
      ) {
        throw new Error(
          'This file type is not allowed. Please use images, documents, or text files.'
        );
      }
      throw error;
    }
  },

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await api.get(`/v1/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getThumbnail(fileId: string): Promise<string> {
    const response = await api.get(`/v1/files/${fileId}/thumbnail`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/v1/files/${fileId}`);
  },
};

export const notificationsApi = {
  async getNotifications(params?: any): Promise<any> {
    const response = await api.get('/v1/notifications', { params });
    return response.data.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.put(`/v1/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/v1/notifications/read-all');
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/v1/notifications/${notificationId}`);
  },
};

export const connectionsApi = {
  async get(): Promise<any> {
    const response = await api.get('/v1/connections');
    return response.data.data;
  },

  async request(username: string): Promise<any> {
    const response = await api.post('/v1/connections/request', { username });
    return response.data.data || response.data;
  },

  async acceptRequest(requestId: string): Promise<any> {
    const response = await api.put(`/v1/connections/${requestId}/accept`);
    return response.data.data || response.data;
  },

  async rejectRequest(requestId: string): Promise<any> {
    const response = await api.put(`/v1/connections/${requestId}/reject`);
    return response.data.data || response.data;
  },
};

export const usersApi = {
  async searchUsers(query: string, limit: number = 10): Promise<any> {
    const response = await api.get('/v1/users/search', {
      params: { query, limit },
    });
    return response.data.data;
  },

  async updateProfile(data: any): Promise<any> {
    const response = await api.put('/v1/users/profile', data);
    return response.data.data;
  },

  async logout(): Promise<any> {
    try {
      const response = await api.post('/auth/logout');
      localStorage.removeItem('letschat_token');
      return response.data.data;
    } catch (error) {
      // Even if logout fails, clear local token
      localStorage.removeItem('letschat_token');
      throw error;
    }
  },
};

export default api;
