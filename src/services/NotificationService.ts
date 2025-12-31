import { NotificationRepository } from '../database/repositories/NotificationRepository';
import {
  Notification,
  CreateNotificationRequest,
  NotificationCount,
} from '../types/Notification';

export class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification(
    userId: string,
    type:
      | 'message'
      | 'connection_request'
      | 'mention'
      | 'system'
      | 'incoming-call'
      | 'call-missed'
      | 'call-ended',
    title: string,
    message: string,
    data?: any
  ): Promise<Notification> {
    const notification = await NotificationRepository.create(
      userId,
      type,
      title,
      message,
      data
    );

    // Send real-time notification (if WebSocket is available)
    try {
      const WebSocketManager = (await import('../websocket/WebSocketManager'))
        .default;
      WebSocketManager.getInstance().sendNotificationToUser(
        userId,
        notification
      );
    } catch (error) {
      // WebSocket not available, continue without real-time notification
    }

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    return await NotificationRepository.findByUserId(userId, limit, offset);
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnreadNotifications(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    return await NotificationRepository.findUnreadByUserId(userId, limit);
  }

  /**
   * Get notifications by type for a user
   */
  static async getNotificationsByType(
    userId: string,
    type: 'message' | 'connection_request' | 'mention' | 'system',
    limit: number = 50
  ): Promise<Notification[]> {
    return await NotificationRepository.findByUserIdAndType(
      userId,
      type,
      limit
    );
  }

  /**
   * Mark a notification as read
   */
  static async markNotificationAsRead(
    notificationId: string
  ): Promise<boolean> {
    return await NotificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllNotificationsAsRead(userId: string): Promise<number> {
    return await NotificationRepository.markAllAsRead(userId);
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    return await NotificationRepository.delete(notificationId);
  }

  /**
   * Delete all read notifications for a user
   */
  static async deleteReadNotifications(userId: string): Promise<number> {
    return await NotificationRepository.deleteRead(userId);
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return await NotificationRepository.getUnreadCount(userId);
  }

  /**
   * Get unread count by type for a user
   */
  static async getUnreadCountByType(
    userId: string,
    type: 'message' | 'connection_request' | 'mention' | 'system'
  ): Promise<number> {
    return await NotificationRepository.getUnreadCountByType(userId, type);
  }

  /**
   * Get all unread counts by type for a user
   */
  static async getUnreadCounts(userId: string): Promise<NotificationCount> {
    return await NotificationRepository.getUnreadCounts(userId);
  }

  /**
   * Create a connection request notification
   */
  static async createConnectionRequestNotification(
    recipientId: string,
    requesterName: string,
    connectionId: string
  ): Promise<Notification> {
    return await this.createNotification(
      recipientId,
      'connection_request',
      'New Friend Request',
      `${requesterName} sent you a friend request`,
      {
        connectionId,
        requesterName,
        type: 'connection_request',
      }
    );
  }

  /**
   * Create a connection accepted notification
   */
  static async createConnectionAcceptedNotification(
    recipientId: string,
    accepterName: string
  ): Promise<Notification> {
    return await this.createNotification(
      recipientId,
      'connection_request',
      'Friend Request Accepted',
      `${accepterName} accepted your friend request`,
      {
        type: 'connection_accepted',
        accepterName,
      }
    );
  }

  /**
   * Create a connection declined notification
   */
  static async createConnectionDeclinedNotification(
    recipientId: string,
    declinerName: string
  ): Promise<Notification> {
    return await this.createNotification(
      recipientId,
      'connection_request',
      'Friend Request Declined',
      `${declinerName} declined your friend request`,
      {
        type: 'connection_declined',
        declinerName,
      }
    );
  }

  /**
   * Create a new message notification
   */
  static async createMessageNotification(
    recipientId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string
  ): Promise<Notification> {
    return await this.createNotification(
      recipientId,
      'message',
      'New Message',
      `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
      {
        conversationId,
        senderName,
        type: 'new_message',
      }
    );
  }

  /**
   * Create a system notification
   */
  static async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<Notification> {
    return await this.createNotification(
      userId,
      'system',
      title,
      message,
      data
    );
  }

  /**
   * Create an incoming call notification
   */
  static async createIncomingCallNotification(
    userId: string,
    callerName: string,
    callType: 'voice' | 'video',
    conversationId: string
  ): Promise<Notification> {
    return await this.createNotification(
      userId,
      'incoming-call',
      `Incoming ${callType} call`,
      `${callerName} is calling you`,
      {
        callType,
        conversationId,
        callerName,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Create a missed call notification
   */
  static async createMissedCallNotification(
    userId: string,
    callerName: string,
    callType: 'voice' | 'video'
  ): Promise<Notification> {
    return await this.createNotification(
      userId,
      'call-missed',
      'Missed call',
      `You missed a ${callType} call from ${callerName}`,
      {
        callType,
        callerName,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
