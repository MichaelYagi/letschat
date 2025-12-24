import db from '../connection';
import {
  UserConnection,
  CreateConnectionRequest,
  ConnectionRequestResponse,
  UserConnectionWithProfile,
  ConnectionStatus,
} from '../../types/Connection';
import { EncryptionService } from '../../utils/encryption';

export class ConnectionRepository {
  /**
   * Create a connection request
   */
  static async createRequest(
    requesterId: string,
    addresseeId: string
  ): Promise<UserConnection> {
    const connectionId = EncryptionService.generateUUID();

    // Check if connection already exists
    const existingConnection = await this.findExistingConnection(
      requesterId,
      addresseeId
    );

    if (existingConnection) {
      throw new Error('Connection request already exists');
    }

    const [connection] = await db('user_connections')
      .insert({
        id: connectionId,
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return this.mapDbConnectionToConnection(connection);
  }

  /**
   * Find existing connection between two users
   */
  static async findExistingConnection(
    user1Id: string,
    user2Id: string
  ): Promise<UserConnection | null> {
    const connection = await db('user_connections')
      .where(builder => {
        builder
          .where('requester_id', user1Id)
          .andWhere('addressee_id', user2Id)
          .orWhere('requester_id', user2Id)
          .andWhere('addressee_id', user1Id);
      })
      .first();

    return connection ? this.mapDbConnectionToConnection(connection) : null;
  }

  /**
   * Get pending requests for user
   */
  static async getPendingRequests(
    userId: string
  ): Promise<UserConnectionWithProfile[]> {
    const requests = await db('user_connections')
      .join(
        'users as requester',
        'user_connections.requester_id',
        'requester.id'
      )
      .join(
        'users as addressee',
        'user_connections.addressee_id',
        'addressee.id'
      )
      .where('user_connections.addressee_id', userId)
      .where('user_connections.status', 'pending')
      .select([
        'user_connections.*',
        'requester.username as requester_username',
        'requester.avatar_url as requester_avatar_url',
        'requester.status as requester_status',
        'addressee.username as addressee_username',
        'addressee.avatar_url as addressee_avatar_url',
        'addressee.status as addressee_status',
      ]);

    return requests.map(this.mapDbConnectionWithProfiles);
  }

  /**
   * Get user's connections
   */
  static async getUserConnections(
    userId: string
  ): Promise<UserConnectionWithProfile[]> {
    const connections = await db('user_connections')
      .join(
        'users as requester',
        'user_connections.requester_id',
        'requester.id'
      )
      .join(
        'users as addressee',
        'user_connections.addressee_id',
        'addressee.id'
      )
      .where(builder => {
        builder
          .where('user_connections.requester_id', userId)
          .orWhere('user_connections.addressee_id', userId);
      })
      .where('user_connections.status', 'accepted')
      .select([
        'user_connections.*',
        'requester.username as requester_username',

        'requester.avatar_url as requester_avatar_url',
        'requester.status as requester_status',
        'addressee.username as addressee_username',

        'addressee.avatar_url as addressee_avatar_url',
        'addressee.status as addressee_status',
      ])
      .orderBy('user_connections.updated_at', 'desc');

    return connections.map(this.mapDbConnectionWithProfiles);
  }

  /**
   * Get connection status between two users
   */
  static async getConnectionStatus(
    user1Id: string,
    user2Id: string
  ): Promise<ConnectionStatus> {
    const connection = await this.findExistingConnection(user1Id, user2Id);

    if (!connection) {
      return { isConnected: false, initiatedBy: 'me' };
    }

    const initiatedBy = connection.requesterId === user1Id ? 'me' : 'them';

    return {
      isConnected: connection.status === 'accepted',
      status: connection.status,
      initiatedBy,
    };
  }

  /**
   * Respond to connection request
   */
  static async respondToRequest(
    connectionId: string,
    userId: string,
    response: ConnectionRequestResponse
  ): Promise<UserConnection | null> {
    // Verify user is the addressee
    const connection = await db('user_connections')
      .where('id', connectionId)
      .where('addressee_id', userId)
      .first();

    if (!connection) {
      throw new Error('Connection request not found');
    }

    if (connection.status !== 'pending') {
      throw new Error('Connection request already processed');
    }

    const [updatedConnection] = await db('user_connections')
      .where('id', connectionId)
      .where('addressee_id', userId)
      .update({
        status: response.status,
        updated_at: new Date(),
      })
      .returning('*');

    return updatedConnection
      ? this.mapDbConnectionToConnection(updatedConnection)
      : null;
  }

  /**
   * Remove connection
   */
  static async removeConnection(
    connectionId: string,
    userId: string
  ): Promise<boolean> {
    // Verify user is part of the connection
    const connection = await db('user_connections')
      .where('id', connectionId)
      .where(builder => {
        builder.where('requester_id', userId).orWhere('addressee_id', userId);
      })
      .first();

    if (!connection) {
      throw new Error('Connection not found');
    }

    const deletedCount = await db('user_connections')
      .where('id', connectionId)
      .del();

    return deletedCount > 0;
  }

  /**
   * Block user
   */
  static async blockUser(
    requesterId: string,
    addresseeId: string
  ): Promise<UserConnection> {
    // Check if connection exists
    const existingConnection = await this.findExistingConnection(
      requesterId,
      addresseeId
    );

    if (existingConnection) {
      // Update existing connection to blocked
      const [updatedConnection] = await db('user_connections')
        .where('id', existingConnection.id)
        .update({
          status: 'blocked',
          updated_at: new Date(),
        })
        .returning('*');

      return this.mapDbConnectionToConnection(updatedConnection);
    } else {
      // Create new blocked connection
      return await this.createRequest(requesterId, addresseeId);
    }
  }

  /**
   * Unblock user
   */
  static async unblockUser(
    requesterId: string,
    addresseeId: string
  ): Promise<boolean> {
    const deletedCount = await db('user_connections')
      .where('requester_id', requesterId)
      .where('addressee_id', addresseeId)
      .where('status', 'blocked')
      .del();

    return deletedCount > 0;
  }

  /**
   * Get blocked users
   */
  static async getBlockedUsers(
    userId: string
  ): Promise<UserConnectionWithProfile[]> {
    const blocked = await db('user_connections')
      .join(
        'users as requester',
        'user_connections.requester_id',
        'requester.id'
      )
      .join(
        'users as addressee',
        'user_connections.addressee_id',
        'addressee.id'
      )
      .where('user_connections.requester_id', userId)
      .where('user_connections.status', 'blocked')
      .select([
        'user_connections.*',
        'requester.username as requester_username',

        'requester.avatar_url as requester_avatar_url',
        'requester.status as requester_status',
        'addressee.username as addressee_username',

        'addressee.avatar_url as addressee_avatar_url',
        'addressee.status as addressee_status',
      ]);

    return blocked.map(this.mapDbConnectionWithProfiles);
  }

  /**
   * Map database connection to UserConnection model
   */
  private static mapDbConnectionToConnection(
    dbConnection: any
  ): UserConnection {
    return {
      id: dbConnection.id,
      requesterId: dbConnection.requester_id,
      addresseeId: dbConnection.addressee_id,
      status: dbConnection.status,
      createdAt: new Date(dbConnection.created_at),
      updatedAt: new Date(dbConnection.updated_at),
    };
  }

  /**
   * Map database connection with user profiles
   */
  private static mapDbConnectionWithProfiles(
    dbConnection: any
  ): UserConnectionWithProfile {
    return {
      id: dbConnection.id,
      requesterId: dbConnection.requester_id,
      addresseeId: dbConnection.addressee_id,
      status: dbConnection.status,
      createdAt: new Date(dbConnection.created_at),
      updatedAt: new Date(dbConnection.updated_at),
      requesterProfile: {
        id: dbConnection.requester_id,
        username: dbConnection.requester_username,
        displayName: dbConnection.requester_username, // Use username as display_name
        avatarUrl: dbConnection.requester_avatar_url,
        status: dbConnection.requester_status,
      },
      addresseeProfile: {
        id: dbConnection.addressee_id,
        username: dbConnection.addressee_username,
        displayName: dbConnection.addressee_username, // Use username as display_name
        avatarUrl: dbConnection.addressee_avatar_url,
        status: dbConnection.addressee_status,
      },
    };
  }
}
