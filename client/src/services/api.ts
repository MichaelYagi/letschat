import axios from 'axios';
import { LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

const API_BASE_URL = '/api';

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

// Handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('letschat_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const { user, tokens } = response.data.data;
    localStorage.setItem('letschat_token', tokens.accessToken);
    return { user, token: tokens.accessToken };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    const { user, tokens } = response.data.data;
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

    const response = await api.post('/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
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

export default api;
