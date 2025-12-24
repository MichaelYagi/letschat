import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { AuthService } from '../services/AuthService';
import { logger } from '../utils/logger';

export class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const verification = await AuthService.verifyToken(token);

      if (!verification.valid || !verification.user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await NotificationService.getUserNotifications(
        verification.user.id,
        limit,
        offset
      );

      res.json({
        notifications,
        pagination: {
          limit,
          offset,
        },
      });
    } catch (error) {
      logger.error('Error getting notifications:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  }

  /**
   * Get unread notifications for the authenticated user
   */
  static async getUnreadNotifications(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const verification = await AuthService.verifyToken(token);

      if (!verification.valid || !verification.user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await NotificationService.getUnreadNotifications(
        verification.user.id,
        limit
      );

      res.json({ notifications });
    } catch (error) {
      logger.error('Error getting unread notifications:', error);
      res.status(500).json({ error: 'Failed to get unread notifications' });
    }
  }

  /**
   * Get notifications by type for the authenticated user
   */
  static async getNotificationsByType(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const verification = await AuthService.verifyToken(token);

      if (!verification.valid || !verification.user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const { type } = req.params;
      const validTypes = ['message', 'connection_request', 'mention', 'system'];

      if (!validTypes.includes(type)) {
        res.status(400).json({ error: 'Invalid notification type' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await NotificationService.getNotificationsByType(
        verification.user.id,
        type as any,
        limit
      );

      res.json({ notifications });
    } catch (error) {
      logger.error('Error getting notifications by type:', error);
      res.status(500).json({ error: 'Failed to get notifications by type' });
    }
  }

  /**
   * Mark a notification as read
   */
  static async markNotificationAsRead(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const verification = await AuthService.verifyToken(token);

      if (!verification.valid || !verification.user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const { notificationId } = req.params;

      const updated =
        await NotificationService.markNotificationAsRead(notificationId);

      if (!updated) {
        res
          .status(404)
          .json({ error: 'Notification not found or already read' });
        return;
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const verification = await AuthService.verifyToken(token);

      if (!verification.valid || !verification.user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const count = await NotificationService.markAllNotificationsAsRead(
        verification.user.id
      );

      res.json({ message: `Marked ${count} notifications as read`, count });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res
        .status(500)
        .json({ error: 'Failed to mark all notifications as read' });
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const verification = await AuthService.verifyToken(token);

      if (!verification.valid || !verification.user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const { notificationId } = req.params;

      const deleted =
        await NotificationService.deleteNotification(notificationId);

      if (!deleted) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({ message: 'Notification deleted' });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  /**
   * Delete all read notifications
   */
  static async deleteReadNotifications(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const verification = await AuthService.verifyToken(token);

      if (!verification.valid || !verification.user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const count = await NotificationService.deleteReadNotifications(
        verification.user.id
      );

      res.json({ message: `Deleted ${count} read notifications`, count });
    } catch (error) {
      logger.error('Error deleting read notifications:', error);
      res.status(500).json({ error: 'Failed to delete read notifications' });
    }
  }

  /**
   * Get unread notification counts
   */
  static async getUnreadCounts(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const verification = await AuthService.verifyToken(token);

      if (!verification.valid || !verification.user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const counts = await NotificationService.getUnreadCounts(
        verification.user.id
      );

      res.json(counts);
    } catch (error) {
      logger.error('Error getting unread counts:', error);
      res.status(500).json({ error: 'Failed to get unread counts' });
    }
  }
}
