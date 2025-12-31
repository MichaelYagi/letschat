import db from '../connection';
import {
  Notification,
  CreateNotificationRequest,
  NotificationWithProfile,
  NotificationCount,
} from '../../types/Notification';
import { EncryptionService } from '../../utils/encryption';

export class NotificationRepository {
  /**
   * Create a new notification
   */
  static async create(
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
    const notificationId = EncryptionService.generateUUID();

    const [notification] = await db('notifications')
      .insert({
        id: notificationId,
        user_id: userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        created_at: new Date(),
      })
      .returning('*');

    return notification;
  }

  /**
   * Find notification by ID
   */
  static async findById(id: string): Promise<Notification | null> {
    const notification = await db('notifications').where('id', id).first();

    return notification || null;
  }

  /**
   * Get all notifications for a user
   */
  static async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    return await db('notifications')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get unread notifications for a user
   */
  static async findUnreadByUserId(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    return await db('notifications')
      .where('user_id', userId)
      .whereNull('read_at')
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  /**
   * Get notifications by type for a user
   */
  static async findByUserIdAndType(
    userId: string,
    type: 'message' | 'connection_request' | 'mention' | 'system',
    limit: number = 50
  ): Promise<Notification[]> {
    return await db('notifications')
      .where('user_id', userId)
      .where('type', type)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: string): Promise<boolean> {
    const result = await db('notifications')
      .where('id', id)
      .whereNull('read_at')
      .update({
        read_at: new Date(),
      });

    return result > 0;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    return await db('notifications')
      .where('user_id', userId)
      .whereNull('read_at')
      .update({
        read_at: new Date(),
      });
  }

  /**
   * Delete notification
   */
  static async delete(id: string): Promise<boolean> {
    const result = await db('notifications').where('id', id).del();

    return result > 0;
  }

  /**
   * Delete all read notifications for a user
   */
  static async deleteRead(userId: string): Promise<number> {
    return await db('notifications')
      .where('user_id', userId)
      .whereNotNull('read_at')
      .del();
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db('notifications')
      .where('user_id', userId)
      .whereNull('read_at')
      .count({ count: '*' });

    return Number(result.count);
  }

  /**
   * Get unread count by type for a user
   */
  static async getUnreadCountByType(
    userId: string,
    type: 'message' | 'connection_request' | 'mention' | 'system'
  ): Promise<number> {
    const [result] = await db('notifications')
      .where('user_id', userId)
      .where('type', type)
      .whereNull('read_at')
      .count({ count: '*' });

    return Number(result.count);
  }

  /**
   * Get all unread counts by type for a user
   */
  static async getUnreadCounts(userId: string): Promise<NotificationCount> {
    const [messagesResult] = await db('notifications')
      .where('user_id', userId)
      .where('type', 'message')
      .whereNull('read_at')
      .count({ count: '*' });

    const [connectionRequestsResult] = await db('notifications')
      .where('user_id', userId)
      .where('type', 'connection_request')
      .whereNull('read_at')
      .count({ count: '*' });

    const [mentionsResult] = await db('notifications')
      .where('user_id', userId)
      .where('type', 'mention')
      .whereNull('read_at')
      .count({ count: '*' });

    const [systemResult] = await db('notifications')
      .where('user_id', userId)
      .where('type', 'system')
      .whereNull('read_at')
      .count({ count: '*' });

    const [callsResult] = await db('notifications')
      .where('user_id', userId)
      .whereIn('type', ['incoming-call', 'call-missed', 'call-ended'])
      .whereNull('read_at')
      .count({ count: '*' });

    const [totalResult] = await db('notifications')
      .where('user_id', userId)
      .whereNull('read_at')
      .count({ count: '*' });

    return {
      total: Number(totalResult.count),
      messages: Number(messagesResult.count),
      connection_requests: Number(connectionRequestsResult.count),
      mentions: Number(mentionsResult.count),
      system: Number(systemResult.count),
      calls: Number(callsResult.count),
    };
  }
}
