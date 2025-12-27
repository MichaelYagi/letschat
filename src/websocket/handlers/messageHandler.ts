import { Server as SocketIOServer, Socket } from 'socket.io';
import { authMiddleware } from '../../config/jwt';
import { MessageService } from '../../services/MessageService';
import { AuthService } from '../../services/AuthService';
import { NotificationService } from '../../services/NotificationService';
import { MessageDecryptionService } from '../../services/MessageDecryptionService';
import { UserRepository } from '../../database/repositories/UserRepository';
import { ConversationRepository } from '../../database/repositories/MessageRepository';
import { ReadReceiptRepository } from '../../database/repositories/ReadReceiptRepository';
import WebSocketManager from '../WebSocketManager';
import {
  WebSocketMessage,
  TypingEvent,
  UserStatusEvent,
  CreateMessageRequest,
  MessageReactionEvent,
} from '../../types/Message';
import { Notification } from '../../types/Notification';
import { logger } from '../../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket[]> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set of userIds
  private offlineMessageQueue: Map<string, any[]> = new Map(); // userId -> queued messages
  private readReceiptRepository: ReadReceiptRepository;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.readReceiptRepository = new ReadReceiptRepository();
    this.setupMiddleware();
    this.setupEventHandlers();
    this.startHeartbeat();

    // Register with WebSocketManager
    WebSocketManager.getInstance().setWebSocketService(this);
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const verification = await AuthService.verifyToken(token);

        if (!verification.valid) {
          return next(new Error('Invalid token'));
        }

        socket.userId = verification.user!.id;
        socket.username = verification.user!.username;

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      await this.handleConnection(socket);
    });
  }

  /**
   * Handle new connection
   */
  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    logger.info(`User ${socket.username} (${socket.userId}) connected`);

    // Add to connected users
    if (!this.connectedUsers.has(socket.userId!)) {
      this.connectedUsers.set(socket.userId!, []);
    }
    this.connectedUsers.get(socket.userId!)!.push(socket);

    // Update user status to online
    this.broadcastUserStatus(socket.userId!, 'online');

    // Deliver queued messages for this user
    await this.deliverQueuedMessages(socket);

    // Fetch and deliver any missed messages from database
    await this.deliverMissedMessages(socket);

    // Setup event listeners for this socket
    socket.on('join_conversation', data =>
      this.handleJoinConversation(socket, data)
    );
    socket.on('leave_conversation', data =>
      this.handleLeaveConversation(socket, data)
    );
    socket.on('send_message', data => this.handleSendMessage(socket, data));
    socket.on('typing', data => this.handleTyping(socket, data));
    socket.on('mark_read', data => this.handleMarkRead(socket, data));
    socket.on('message_reaction', data => this.handleReaction(socket, data));
    socket.on('mark_notification_read', data =>
      this.handleMarkNotificationRead(socket, data)
    );
    socket.on('mark_all_notifications_read', () =>
      this.handleMarkAllNotificationsRead(socket)
    );
    socket.on('ping', () => this.handlePing(socket));
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  /**
   * Handle joining a conversation
   */
  private async handleJoinConversation(
    socket: AuthenticatedSocket,
    { conversationId }: { conversationId: string }
  ): Promise<void> {
    try {
      // Verify user is participant
      const conversations = await MessageService.getConversations(
        socket.userId!
      );
      const isParticipant = conversations.some(
        conv => conv.id === conversationId
      );

      if (!isParticipant) {
        socket.emit('error', {
          message: 'Not authorized to join this conversation',
        });
        return;
      }

      // Join socket room
      socket.join(conversationId);
      logger.info(
        `User ${socket.username} joined conversation ${conversationId}`
      );

      socket.emit('joined_conversation', { conversationId });
    } catch (error) {
      logger.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  }

  /**
   * Handle leaving a conversation
   */
  private handleLeaveConversation(
    socket: AuthenticatedSocket,
    { conversationId }: { conversationId: string }
  ): void {
    socket.leave(conversationId);
    logger.info(`User ${socket.username} left conversation ${conversationId}`);

    // Remove from typing indicator
    const typingUsers = this.typingUsers.get(conversationId);
    if (typingUsers) {
      typingUsers.delete(socket.userId!);
      this.broadcastTyping(conversationId);
    }

    socket.emit('left_conversation', { conversationId });
  }

  /**
   * Handle sending a message
   */
  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: CreateMessageRequest
  ): Promise<void> {
    try {
      // For now, we'll send messages without end-to-end encryption
      // In a real implementation, you'd fetch recipient's public key
      const messageEvent = await MessageService.sendMessage(
        data,
        socket.userId!
      );

      // Get sender information
      const sender = await UserRepository.findById(socket.userId!);

      // Add sender info to message and map fields for client
      const messageWithSender = {
        ...messageEvent.message,
        timestamp: messageEvent.message.createdAt.toISOString(), // Map createdAt to timestamp
        sender: sender
          ? {
              id: sender.id,
              username: sender.username,
              displayName: sender.username, // Use username as displayName since User doesn't have displayName field
              avatarUrl: sender.avatarUrl,
            }
          : {
              id: socket.userId!,
              username: socket.username || 'Unknown',
              displayName: socket.username || 'Unknown',
            },
      };

      // Get conversation participants
      const participants = await ConversationRepository.getParticipants(
        data.conversationId
      );

      // Send individualized messages to each participant
      for (const participant of participants) {
        // Prepare message for this user (including sender)
        let messageForUser;

        if (participant.userId === socket.userId) {
          // For sender, use the original message with sender info
          messageForUser = {
            ...messageWithSender,
            isOwn: true, // Mark as own message for the sender
          };
        } else {
          // For other users, decrypt message for this user
          const decryptedMessage =
            await MessageDecryptionService.decryptMessage(
              messageEvent.message,
              participant.userId
            );

          messageForUser = {
            ...decryptedMessage,
            timestamp: decryptedMessage.createdAt.toISOString(),
            sender: sender
              ? {
                  id: sender.id,
                  username: sender.username,
                  displayName: sender.username,
                  avatarUrl: sender.avatarUrl,
                }
              : {
                  id: socket.userId!,
                  username: socket.username || 'Unknown',
                  displayName: socket.username || 'Unknown',
                },
            isOwn: false,
          };
        }

        // Check if user is online
        if (this.connectedUsers.has(participant.userId)) {
          // User is online - send immediately and mark as delivered
          this.sendToUser(participant.userId, 'new_message', messageForUser);
          await this.readReceiptRepository.updateDeliveryStatus(
            messageEvent.message.id,
            participant.userId,
            'delivered'
          );
        } else {
          // User is offline - queue message for later delivery
          this.queueOfflineMessage(participant.userId, messageForUser);
          await this.readReceiptRepository.updateDeliveryStatus(
            messageEvent.message.id,
            participant.userId,
            'sent'
          );
        }
      }

      logger.info(
        `User ${socket.username} sent message to ${data.conversationId}`
      );
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  }

  /**
   * Handle typing indicator
   */
  private handleTyping(
    socket: AuthenticatedSocket,
    { conversationId, isTyping }: TypingEvent
  ): void {
    const typingUsers = this.typingUsers.get(conversationId);

    if (!typingUsers) {
      this.typingUsers.set(conversationId, new Set());
    }

    const users = this.typingUsers.get(conversationId)!;

    if (isTyping) {
      users.add(socket.userId!);
    } else {
      users.delete(socket.userId!);
    }

    // Broadcast typing status
    this.broadcastTyping(conversationId);
  }

  /**
   * Handle marking messages as read
   */
  private async handleMarkRead(
    socket: AuthenticatedSocket,
    { conversationId }: { conversationId: string }
  ): Promise<void> {
    try {
      await MessageService.markAsRead(conversationId, socket.userId!);

      // In a real implementation, you might broadcast read receipts
      socket.emit('messages_marked_read', { conversationId });
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  /**
   * Handle message reaction
   */
  private async handleReaction(
    socket: AuthenticatedSocket,
    data: MessageReactionEvent
  ): Promise<void> {
    try {
      // Broadcast reaction to conversation room
      this.io.to(data.messageId).emit('message_reaction', data);

      logger.info(
        `User ${socket.username} ${data.action} reaction ${data.emoji} to message ${data.messageId}`
      );
    } catch (error) {
      logger.error('Error handling reaction:', error);
      socket.emit('error', { message: 'Failed to handle reaction' });
    }
  }

  /**
   * Handle notification marked as read
   */
  private async handleMarkNotificationRead(
    socket: AuthenticatedSocket,
    { notificationId }: { notificationId: string }
  ): Promise<void> {
    try {
      const updated =
        await NotificationService.markNotificationAsRead(notificationId);

      if (updated) {
        socket.emit('notification_marked_read', { notificationId });
        logger.info(
          `User ${socket.username} marked notification ${notificationId} as read`
        );
      } else {
        socket.emit('error', {
          message: 'Notification not found or already read',
        });
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  /**
   * Handle all notifications marked as read
   */
  private async handleMarkAllNotificationsRead(
    socket: AuthenticatedSocket
  ): Promise<void> {
    try {
      const count = await NotificationService.markAllNotificationsAsRead(
        socket.userId!
      );

      socket.emit('all_notifications_marked_read', { count });
      logger.info(
        `User ${socket.username} marked ${count} notifications as read`
      );
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      socket.emit('error', {
        message: 'Failed to mark all notifications as read',
      });
    }
  }

  /**
   * Handle ping for connection health
   */
  private handlePing(socket: AuthenticatedSocket): void {
    socket.emit('pong');
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket): void {
    logger.info(`User ${socket.username} (${socket.userId}) disconnected`);

    // Remove from connected users
    const userSockets = this.connectedUsers.get(socket.userId!);
    if (userSockets) {
      const index = userSockets.indexOf(socket);
      if (index > -1) {
        userSockets.splice(index, 1);
      }

      if (userSockets.length === 0) {
        this.connectedUsers.delete(socket.userId!);

        // Update user status to offline
        this.broadcastUserStatus(socket.userId!, 'offline');
      }
    }

    // Clean up typing indicators
    for (const [conversationId, typingUsers] of this.typingUsers.entries()) {
      if (typingUsers.has(socket.userId!)) {
        typingUsers.delete(socket.userId!);
        this.broadcastTyping(conversationId);
      }
    }
  }

  /**
   * Broadcast user status
   */
  private broadcastUserStatus(
    userId: string,
    status: 'online' | 'offline'
  ): void {
    const statusEvent: UserStatusEvent = {
      userId,
      status,
    };

    this.io.emit('user_status', statusEvent);
  }

  /**
   * Broadcast typing status for a conversation
   */
  private broadcastTyping(conversationId: string): void {
    const typingUsers = this.typingUsers.get(conversationId) || new Set();

    const typingEvent = Array.from(typingUsers).map(userId => ({
      conversationId,
      userId,
      isTyping: true,
    }));

    this.io.to(conversationId).emit('typing', typingEvent);
  }

  /**
   * Queue message for offline user
   */
  private queueOfflineMessage(userId: string, message: any): void {
    if (!this.offlineMessageQueue.has(userId)) {
      this.offlineMessageQueue.set(userId, []);
    }

    const queue = this.offlineMessageQueue.get(userId)!;
    queue.push(message);

    logger.info(
      `Queued message for offline user ${userId}. Queue size: ${queue.length}`
    );
  }

  /**
   * Deliver missed messages from database for offline user
   */
  private async deliverMissedMessages(
    socket: AuthenticatedSocket
  ): Promise<void> {
    try {
      const userId = socket.userId!;

      // Get user's conversations
      const conversations = await MessageService.getConversations(userId);

      for (const conversation of conversations) {
        // Get messages since user's last activity - simplified version for now
        // We'll use a simpler approach to avoid dependency on getMessagesSince method
        const messages = await MessageService.getMessages(
          conversation.id,
          userId,
          50
        );

        if (messages.length > 0) {
          for (const message of messages) {
            // Only deliver messages sent by others
            if (message.senderId === userId) continue;

            // Get sender information
            const sender = await UserRepository.findById(message.senderId);

            // Decrypt message for this user
            const decryptedMessage =
              await MessageDecryptionService.decryptMessage(message, userId);

            const messageForUser = {
              ...decryptedMessage,
              timestamp: decryptedMessage.createdAt.toISOString(),
              sender: sender
                ? {
                    id: sender.id,
                    username: sender.username,
                    displayName: sender.username,
                    avatarUrl: sender.avatarUrl,
                  }
                : {
                    id: message.senderId,
                    username: 'Unknown',
                    displayName: 'Unknown',
                  },
            };

            socket.emit('missed_message', messageForUser);

            // Update delivery status
            await this.readReceiptRepository.updateDeliveryStatus(
              message.id,
              userId,
              'delivered'
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error delivering missed messages:', error);
    }
  }

  /**
   * Deliver queued messages to reconnected user
   */
  private async deliverQueuedMessages(
    socket: AuthenticatedSocket
  ): Promise<void> {
    const userId = socket.userId!;
    const queuedMessages = this.offlineMessageQueue.get(userId);

    if (!queuedMessages || queuedMessages.length === 0) {
      return;
    }

    try {
      logger.info(
        `Delivering ${queuedMessages.length} queued messages to user ${userId}`
      );

      // Deliver all queued messages
      for (const message of queuedMessages) {
        socket.emit('new_message', message);

        // Update delivery status to delivered
        await this.readReceiptRepository.updateDeliveryStatus(
          message.id,
          userId,
          'delivered'
        );
      }

      // Clear the queue for this user
      this.offlineMessageQueue.delete(userId);

      logger.info(
        `Successfully delivered ${queuedMessages.length} messages to user ${userId}`
      );
    } catch (error) {
      logger.error('Error delivering queued messages:', error);
      socket.emit('error', {
        message:
          'Some messages failed to deliver. Please refresh the conversation.',
      });
    }
  }

  /**
   * Send message to specific user
   */
  public sendToUser(userId: string, event: string, data: any): void {
    const userSockets = this.connectedUsers.get(userId);

    if (userSockets) {
      userSockets.forEach(socket => {
        socket.emit(event, data);
      });
    }
  }

  /**
   * Send notification to specific user
   */
  public sendNotificationToUser(
    userId: string,
    notification: Notification
  ): void {
    this.sendToUser(userId, 'new_notification', { notification });
  }

  /**
   * Send notification count update to user
   */
  public async updateNotificationCount(userId: string): Promise<void> {
    try {
      const counts = await NotificationService.getUnreadCounts(userId);
      this.sendToUser(userId, 'notification_count_update', counts);
    } catch (error) {
      logger.error('Error updating notification count:', error);
    }
  }

  /**
   * Send message to conversation
   */
  public sendToConversation(
    conversationId: string,
    event: string,
    data: any
  ): void {
    this.io.to(conversationId).emit(event, data);
  }

  /**
   * Start heartbeat for connection health
   */
  private startHeartbeat(): void {
    setInterval(() => {
      this.io.emit('heartbeat');
    }, 30000); // 30 seconds
  }

  /**
   * Get connection stats
   */
  public getStats(): {
    totalConnections: number;
    uniqueUsers: number;
    activeConversations: number;
  } {
    const totalConnections = Array.from(this.connectedUsers.values()).reduce(
      (sum, sockets) => sum + sockets.length,
      0
    );

    const uniqueUsers = this.connectedUsers.size;
    const activeConversations = this.typingUsers.size;

    return {
      totalConnections,
      uniqueUsers,
      activeConversations,
    };
  }
}

export const setupWebSocket = (io: SocketIOServer): void => {
  new WebSocketService(io);
};
