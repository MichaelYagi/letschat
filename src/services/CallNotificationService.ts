import { logger } from '../utils/logger';

// Simplified call notification service that bypasses database issues
export class CallNotificationService {
  /**
   * Create and send incoming call notification directly via WebSocket
   */
  static async sendIncomingCallNotification(
    toUserId: string,
    fromUserId: string,
    fromUsername: string,
    callType: 'voice' | 'video',
    conversationId?: string
  ): Promise<void> {
    try {
      const callNotificationId = `call-${fromUserId}-${toUserId}-${Date.now()}`;

      // Create browser notification content
      const title = `Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`;
      const body = `${fromUsername} is calling you`;
      const icon = callType === 'video' ? '📹' : '📞';

      const notificationData = {
        id: callNotificationId,
        type: 'incoming-call',
        fromUserId,
        fromUsername,
        callType,
        offer: null, // Will be populated by actual offer
        conversationId,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'high',
        actionUrl: `/chat${conversationId ? `?conversation=${conversationId}` : ''}`,
      };

      // Get WebSocketManager to send notification
      const { default: WebSocketManager } =
        await import('../websocket/WebSocketManager');
      const wsManager = WebSocketManager.getInstance();

      if (wsManager) {
        const wsService = wsManager.getWebSocketService();
        if (wsService) {
          wsService.sendNotificationToUser(toUserId, {
            id: callNotificationId,
            user_id: toUserId,
            type: 'incoming-call',
            title,
            message: body,
            data: JSON.stringify(notificationData),
            created_at: new Date().toISOString(),
            read_at: null,
          });
        }
      }

      logger.info(
        `Incoming call notification sent: ${fromUsername} -> ${toUserId} (${callType})`
      );
    } catch (error) {
      logger.error('Failed to send incoming call notification:', error);
    }
  }

  /**
   * Create missed call notification
   */
  static async sendMissedCallNotification(
    toUserId: string,
    fromUserId: string,
    fromUsername: string,
    callType: 'voice' | 'video',
    conversationId?: string
  ): Promise<void> {
    try {
      const missedCallNotificationId = `missed-call-${fromUserId}-${toUserId}-${Date.now()}`;

      const title = 'Missed Call';
      const body = `You missed a ${callType === 'video' ? 'video' : 'voice'} call from ${fromUsername}`;
      const icon = '📞';

      const notificationData = {
        id: missedCallNotificationId,
        type: 'call-missed',
        fromUserId,
        fromUsername,
        callType,
        conversationId,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'normal',
        actionUrl: `/chat${conversationId ? `?conversation=${conversationId}` : ''}`,
      };

      // Get WebSocketManager to send notification
      const { default: WebSocketManager } =
        await import('../websocket/WebSocketManager');
      const wsManager = WebSocketManager.getInstance();

      if (wsManager) {
        const wsService = wsManager.getWebSocketService();
        if (wsService) {
          wsService.sendNotificationToUser(toUserId, {
            id: missedCallNotificationId,
            user_id: toUserId,
            type: 'call-missed',
            title,
            message: body,
            data: JSON.stringify(notificationData),
            created_at: new Date().toISOString(),
            read_at: null,
          });
        }
      }

      logger.info(
        `Missed call notification sent: ${fromUsername} -> ${toUserId} (${callType})`
      );
    } catch (error) {
      logger.error('Failed to send missed call notification:', error);
    }
  }
}
