import { Server as SocketIOServer } from 'socket.io';
import { WebSocketService } from './handlers/messageHandler';
import { Notification } from '../types/Notification';

class WebSocketManager {
  private static instance: WebSocketManager;
  private wsService: WebSocketService | null = null;

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  getWebSocketService(): WebSocketService | null {
    return this.wsService;
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: string, notification: Notification): void {
    if (this.wsService) {
      this.wsService.sendNotificationToUser(userId, notification);
    }
  }

  /**
   * Update notification count for user
   */
  async updateNotificationCount(userId: string): Promise<void> {
    if (this.wsService) {
      await this.wsService.updateNotificationCount(userId);
    }
  }
}

export default WebSocketManager;
