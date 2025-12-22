export interface User {
  id: string;
  username: string;
  passwordHash: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  publicKey?: string;
  privateKey?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  generateKeys?: boolean;
  publicKey?: string;
  privateKey?: string;
}

export interface UpdateUserRequest {
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface UserPublic {
  id: string;
  username: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
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
