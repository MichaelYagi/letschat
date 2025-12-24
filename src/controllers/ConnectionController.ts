import { Request, Response } from 'express';
import { ConnectionService } from '../services/ConnectionService';
import {
  CreateConnectionRequest,
  ConnectionRequestResponse,
} from '../types/Connection';

export class ConnectionController {
  /**
   * Send connection request
   */
  static async sendRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const requestData: CreateConnectionRequest = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      if (!requestData.username) {
        res.status(400).json({
          success: false,
          error: 'Username is required',
        });
        return;
      }

      const connection = await ConnectionService.sendRequest(
        userId,
        requestData
      );

      res.status(201).json({
        success: true,
        data: connection,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send connection request',
      });
    }
  }

  /**
   * Get pending connection requests
   */
  static async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const requests = await ConnectionService.getPendingRequests(userId);

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      console.error('Error in getPendingRequests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pending requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's connections
   */
  static async getConnections(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const connections = await ConnectionService.getConnections(userId);

      res.status(200).json({
        success: true,
        data: connections,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get connections',
      });
    }
  }

  /**
   * Get connection status with user
   */
  static async getConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const username = req.query.username as string;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username query parameter is required',
        });
        return;
      }

      const status = await ConnectionService.getConnectionStatus(
        userId,
        username
      );

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get connection status',
      });
    }
  }

  /**
   * Accept connection request
   */
  static async acceptRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { connectionId } = req.body;
      const requestId = req.params.requestId;
      const finalConnectionId = connectionId || requestId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      if (!finalConnectionId) {
        res.status(400).json({
          success: false,
          error: 'Connection ID is required',
        });
        return;
      }

      const connection = await ConnectionService.acceptRequest(
        finalConnectionId,
        userId
      );

      res.status(200).json({
        success: true,
        data: connection,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to accept request',
      });
    }
  }

  /**
   * Decline connection request
   */
  static async declineRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { connectionId } = req.body;
      const requestId = req.params.requestId;
      const finalConnectionId = connectionId || requestId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      if (!finalConnectionId) {
        res.status(400).json({
          success: false,
          error: 'Connection ID is required',
        });
        return;
      }

      const connection = await ConnectionService.declineRequest(
        finalConnectionId,
        userId
      );

      res.status(200).json({
        success: true,
        data: connection,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to decline request',
      });
    }
  }

  /**
   * Remove connection
   */
  static async removeConnection(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { connectionId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      if (!connectionId) {
        res.status(400).json({
          success: false,
          error: 'Connection ID is required',
        });
        return;
      }

      await ConnectionService.removeConnection(connectionId, userId);

      res.status(200).json({
        success: true,
        message: 'Connection removed successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to remove connection',
      });
    }
  }

  /**
   * Block user
   */
  static async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { username } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username is required',
        });
        return;
      }

      const connection = await ConnectionService.blockUser(userId, username);

      res.status(200).json({
        success: true,
        data: connection,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to block user',
      });
    }
  }

  /**
   * Unblock user
   */
  static async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { username } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username is required',
        });
        return;
      }

      const unblocked = await ConnectionService.unblockUser(userId, username);

      res.status(200).json({
        success: true,
        data: { unblocked },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to unblock user',
      });
    }
  }

  /**
   * Get blocked users
   */
  static async getBlockedUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const blocked = await ConnectionService.getBlockedUsers(userId);

      res.status(200).json({
        success: true,
        data: blocked,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get blocked users',
      });
    }
  }

  /**
   * Search users for connections
   */
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const users = await ConnectionService.searchUsers(
        query,
        userId,
        Math.min(limit, 50)
      );

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Search failed',
      });
    }
  }
}
