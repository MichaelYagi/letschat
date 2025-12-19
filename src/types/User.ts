export interface User {
  id: string;
  username: string;
  passwordHash: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface UserPublic {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateSessionRequest {
  userId: string;
  tokenHash: string;
  deviceInfo?: string;
  ipAddress?: string;
}
