export interface UserConnection {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConnectionRequest {
  username: string;
}

export interface ConnectionRequestResponse {
  connectionId: string;
  status: 'accepted' | 'declined';
}

export interface UserConnectionWithProfile extends UserConnection {
  requesterProfile: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status: string;
  };
  addresseeProfile: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status: string;
  };
}

export interface ConnectionStatus {
  isConnected: boolean;
  status?: 'pending' | 'accepted' | 'declined' | 'blocked';
  initiatedBy: 'me' | 'them';
}