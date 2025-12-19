import { UserRepository } from '../database/repositories/UserRepository';
import { SecurityService } from '../utils/security';
import { EncryptionService } from '../utils/encryption';
import { 
  User, 
  CreateUserRequest, 
  LoginRequest, 
  UpdateUserRequest,
  UserPublic,
  UserSession
} from '../types/User';
import { generateToken, verifyToken } from '../config/jwt';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(userData: CreateUserRequest): Promise<{
    user: UserPublic;
    token: string;
  }> {
    // Validate input
    this.validateCreateUserData(userData);
    
    // Check if user already exists
    const existingUser = await UserRepository.findByUsername(userData.username) ||
                       await UserRepository.findByEmail(userData.email);
    
    if (existingUser) {
      if (existingUser.username.toLowerCase() === userData.username.toLowerCase()) {
        throw new Error('Username already taken');
      }
      if (existingUser.email.toLowerCase() === userData.email.toLowerCase()) {
        throw new Error('Email already registered');
      }
    }
    
    // Create user
    const user = await UserRepository.create(userData);
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
    });
    
    // Create session
    const tokenHash = EncryptionService.hash(token);
    await UserRepository.createSession({
      userId: user.id,
      tokenHash,
    });
    
    const publicUser = await UserRepository.getPublicProfile(user.id);
    
    return {
      user: publicUser!,
      token,
    };
  }
  
  /**
   * Login user
   */
  static async login(loginData: LoginRequest, deviceInfo?: string, ipAddress?: string): Promise<{
    user: UserPublic;
    token: string;
  }> {
    // Find user by username
    const user = await UserRepository.findByUsername(loginData.username);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await SecurityService.verifyPassword(
      loginData.password,
      user.passwordHash
    );
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
    });
    
    // Create session
    const tokenHash = EncryptionService.hash(token);
    await UserRepository.createSession({
      userId: user.id,
      tokenHash,
      deviceInfo,
      ipAddress,
    });
    
    // Update user status
    await UserRepository.update(user.id, { status: 'online' });
    
    const publicUser = await UserRepository.getPublicProfile(user.id);
    
    return {
      user: publicUser!,
      token,
    };
  }
  
  /**
   * Logout user
   */
  static async logout(token: string): Promise<void> {
    try {
      const tokenHash = EncryptionService.hash(token);
      const session = await UserRepository.findSessionByTokenHash(tokenHash);
      
      if (session) {
        await UserRepository.deleteSession(session.id);
        
        // Update user status to offline
        await UserRepository.update(session.userId, { status: 'offline' });
      }
    } catch (error) {
      // Log error but don't throw - logout should always succeed
      console.error('Logout error:', error);
    }
  }
  
  /**
   * Logout from all devices
   */
  static async logoutAllDevices(userId: string): Promise<void> {
    await UserRepository.deleteAllUserSessions(userId);
    await UserRepository.update(userId, { status: 'offline' });
  }
  
  /**
   * Verify and refresh token
   */
  static async verifyToken(token: string): Promise<{
    valid: boolean;
    user?: UserPublic;
    error?: string;
  }> {
    try {
      // Verify JWT structure
      const decoded = verifyToken(token);
      
      // Check if session exists
      const tokenHash = EncryptionService.hash(token);
      const session = await UserRepository.findSessionByTokenHash(tokenHash);
      
      if (!session) {
        return { valid: false, error: 'Session not found or expired' };
      }
      
      // Get user
      const user = await UserRepository.getPublicProfile(decoded.userId);
      
      if (!user) {
        return { valid: false, error: 'User not found' };
      }
      
      return { valid: true, user };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }
  
  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: UpdateUserRequest
  ): Promise<UserPublic> {
    this.validateUpdateUserData(updates);
    
    // Check if username is being updated and already exists
    if (updates.displayName) {
      const existingUser = await UserRepository.findById(userId);
      if (existingUser && existingUser.displayName !== updates.displayName) {
        // Additional validation can be added here
      }
    }
    
    const user = await UserRepository.update(userId, updates);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const publicUser = await UserRepository.getPublicProfile(userId);
    
    if (!publicUser) {
      throw new Error('Failed to update user');
    }
    
    return publicUser;
  }
  
  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<UserPublic | null> {
    return await UserRepository.getPublicProfile(userId);
  }
  
  /**
   * Search users
   */
  static async searchUsers(query: string, limit: number = 20): Promise<UserPublic[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    return await UserRepository.searchUsers(query.trim(), limit);
  }
  
  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    return await UserRepository.cleanupExpiredSessions();
  }
  
  /**
   * Validate create user data
   */
  private static validateCreateUserData(userData: CreateUserRequest): void {
    // Validate username
    if (!userData.username || !SecurityService.isValidUsername(userData.username)) {
      throw new Error('Invalid username. Must be 3-20 characters, alphanumeric and underscores only.');
    }
    
    // Validate email
    if (!userData.email || !SecurityService.isValidEmail(userData.email)) {
      throw new Error('Invalid email address');
    }
    
    // Validate password
    const passwordValidation = SecurityService.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Validate display name if provided
    if (userData.displayName && userData.displayName.length > 50) {
      throw new Error('Display name cannot exceed 50 characters');
    }
  }
  
  /**
   * Validate update user data
   */
  private static validateUpdateUserData(updates: UpdateUserRequest): void {
    // Validate display name if provided
    if (updates.displayName !== undefined && updates.displayName.length > 50) {
      throw new Error('Display name cannot exceed 50 characters');
    }
    
    // Validate avatar URL if provided
    if (updates.avatarUrl !== undefined) {
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
      if (updates.avatarUrl && !urlPattern.test(updates.avatarUrl)) {
        throw new Error('Invalid avatar URL format');
      }
    }
    
    // Validate status if provided
    if (updates.status !== undefined) {
      const validStatuses = ['online', 'offline', 'away', 'busy'];
      if (!validStatuses.includes(updates.status)) {
        throw new Error('Invalid status value');
      }
    }
  }
}