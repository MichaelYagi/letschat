import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import {
  CreateUserRequest,
  LoginRequest,
  UpdateUserRequest,
} from '../types/User';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      const result = await AuthService.register(userData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;

      const result = await AuthService.login(loginData, deviceInfo, ipAddress);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(400).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const token = authHeader.substring(7);
      await AuthService.logout(token);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  /**
   * Logout from all devices
   */
  static async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      await AuthService.logoutAllDevices(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to logout from all devices',
      });
    }
  }

  /**
   * Verify token
   */
  static async verify(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(400).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const token = authHeader.substring(7);
      const result = await AuthService.verifyToken(token);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Token verification failed',
      });
    }
  }

  /**
   * Get current user profile
   */
  static async profile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const user = await AuthService.getProfile(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const updates: UpdateUserRequest = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const user = await AuthService.updateProfile(userId, updates);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      });
    }
  }

  /**
   * Search users
   */
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const users = await AuthService.searchUsers(query, Math.min(limit, 50));

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      });
    }
  }
}
