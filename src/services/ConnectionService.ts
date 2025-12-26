import { ConnectionRepository } from '../database/repositories/ConnectionRepository';
import { UserRepository } from '../database/repositories/UserRepository';
import { NotificationService } from './NotificationService';
import {
  UserConnection,
  CreateConnectionRequest,
  ConnectionRequestResponse,
  UserConnectionWithProfile,
  ConnectionStatus,
} from '../types/Connection';

export class ConnectionService {
  /**
   * Send connection request
   */
  static async sendRequest(
    requesterId: string,
    requestData: CreateConnectionRequest
  ): Promise<UserConnection> {
    // Find target user
    const targetUser = await UserRepository.findByUsername(
      requestData.username
    );

    if (!targetUser) {
      throw new Error('User not found');
    }

    if (targetUser.id === requesterId) {
      throw new Error('Cannot send connection request to yourself');
    }

    // Get requester info for notification
    const requester = await UserRepository.findById(requesterId);
    if (!requester) {
      throw new Error('Requester not found');
    }

    // Create connection request
    const connection = await ConnectionRepository.createRequest(
      requesterId,
      targetUser.id
    );

    // Create notification for the recipient
    await NotificationService.createConnectionRequestNotification(
      targetUser.id,
      requester.username,
      connection.id
    );

    return connection;
  }

  /**
   * Get pending connection requests
   */
  static async getPendingRequests(
    userId: string
  ): Promise<UserConnectionWithProfile[]> {
    return await ConnectionRepository.getPendingRequests(userId);
  }

  /**
   * Get user's connections
   */
  static async getConnections(
    userId: string
  ): Promise<UserConnectionWithProfile[]> {
    return await ConnectionRepository.getUserConnections(userId);
  }

  /**
   * Get connection status with another user
   */
  static async getConnectionStatus(
    userId: string,
    otherUsername: string
  ): Promise<ConnectionStatus> {
    const otherUser = await UserRepository.findByUsername(otherUsername);

    if (!otherUser) {
      throw new Error('User not found');
    }

    return await ConnectionRepository.getConnectionStatus(userId, otherUser.id);
  }

  /**
   * Accept connection request
   */
  static async acceptRequest(
    connectionId: string,
    userId: string
  ): Promise<UserConnection> {
    const connection = await ConnectionRepository.respondToRequest(
      connectionId,
      userId,
      { connectionId, status: 'accepted' }
    );

    if (!connection) {
      throw new Error('Connection request not found');
    }

    // Get user info for notification
    const user = await UserRepository.findById(userId);
    const requester = await UserRepository.findById(connection.requesterId);

    if (user && requester) {
      // Create notification for the original requester
      await NotificationService.createConnectionAcceptedNotification(
        connection.requesterId,
        user.username
      );
    }

    return connection;
  }

  /**
   * Decline connection request
   */
  static async declineRequest(
    connectionId: string,
    userId: string
  ): Promise<UserConnection> {
    const connection = await ConnectionRepository.respondToRequest(
      connectionId,
      userId,
      { connectionId, status: 'declined' }
    );

    if (!connection) {
      throw new Error('Connection request not found');
    }

    // Get user info for notification
    const user = await UserRepository.findById(userId);
    const requester = await UserRepository.findById(connection.requesterId);

    if (user && requester) {
      // Create notification for the original requester
      await NotificationService.createConnectionDeclinedNotification(
        connection.requesterId,
        user.username
      );
    }

    return connection;
  }

  /**
   * Remove connection
   */
  static async removeConnection(
    connectionId: string,
    userId: string
  ): Promise<void> {
    // Get connection details before removal for notification
    const connections = await ConnectionRepository.getUserConnections(userId);
    const connection = connections.find(c => c.id === connectionId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    const otherUserId =
      connection.requesterId === userId
        ? connection.addresseeId
        : connection.requesterId;

    // Remove connection
    const removed = await ConnectionRepository.removeConnection(
      connectionId,
      userId
    );

    if (removed) {
      // Real-time notification would be handled by WebSocket service
      // For now, connection is removed successfully
    }
  }

  /**
   * Block user
   */
  static async blockUser(
    userId: string,
    username: string
  ): Promise<UserConnection> {
    const targetUser = await UserRepository.findByUsername(username);

    if (!targetUser) {
      throw new Error('User not found');
    }

    if (targetUser.id === userId) {
      throw new Error('Cannot block yourself');
    }

    const connection = await ConnectionRepository.blockUser(
      userId,
      targetUser.id
    );

    // Real-time notification would be handled by WebSocket service
    // For now, user is blocked successfully

    return connection;
  }

  /**
   * Unblock user
   */
  static async unblockUser(userId: string, username: string): Promise<boolean> {
    const targetUser = await UserRepository.findByUsername(username);

    if (!targetUser) {
      throw new Error('User not found');
    }

    const unblocked = await ConnectionRepository.unblockUser(
      userId,
      targetUser.id
    );

    if (unblocked) {
      // Real-time notification would be handled by WebSocket service
      // For now, user is unblocked successfully
    }

    return unblocked;
  }

  /**
   * Get blocked users
   */
  static async getBlockedUsers(
    userId: string
  ): Promise<UserConnectionWithProfile[]> {
    return await ConnectionRepository.getBlockedUsers(userId);
  }

  /**
   * Search for users to connect with
   */
  static async searchUsers(
    query: string,
    userId: string,
    limit: number = 20
  ): Promise<any[]> {
    // Get all users matching query except current user
    const allUsers = await UserRepository.searchUsers(query, limit * 2);

    // Get user's current connections to filter them out
    const connections = await this.getConnections(userId);
    const connectedUserIds = new Set([
      ...connections.map(c =>
        c.requesterId === userId ? c.addresseeId : c.requesterId
      ),
      ...connections.map(c =>
        c.addresseeId === userId ? c.requesterId : c.addresseeId
      ),
    ]);

    // Filter out already connected users and add connection status
    const usersWithStatus = allUsers
      .filter(user => user.id !== userId && !connectedUserIds.has(user.id))
      .slice(0, limit)
      .map(user => ({
        ...user,
        connectionStatus: 'not_connected',
      }));

    return usersWithStatus;
  }
}
