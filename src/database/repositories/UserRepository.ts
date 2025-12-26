import db from '../connection';
import {
  User,
  CreateUserRequest,
  UserPublic,
  CreateSessionRequest,
  UserSession,
} from '../../types/User';
import { EncryptionService } from '../../utils/encryption';
import { SecurityService } from '../../utils/security';

export class UserRepository {
  /**
   * Create a new user
   */
  static async create(userData: CreateUserRequest): Promise<User> {
    const userId = EncryptionService.generateUUID();
    const passwordHash = await SecurityService.hashPassword(userData.password);

    const [user] = await db('users')
      .insert({
        id: userId,
        username: userData.username.toLowerCase(),
        password_hash: passwordHash,
        public_key: userData.publicKey,
        private_key: userData.privateKey,
        status: 'offline',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return this.mapDbUserToUser(user);
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const user = await db('users').where('id', id).first();
    return user ? this.mapDbUserToUser(user) : null;
  }

  /**
   * Find user by username
   */
  static async findByUsername(username: string): Promise<User | null> {
    const user = await db('users')
      .where('username', username.toLowerCase())
      .first();
    return user ? this.mapDbUserToUser(user) : null;
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username: string): Promise<boolean> {
    const result = await db('users')
      .where('username', username.toLowerCase())
      .first('id');
    return !!result;
  }

  /**
   * Update user
   */
  static async update(
    id: string,
    updates: Partial<User>
  ): Promise<User | null> {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (updates.avatarUrl !== undefined) {
      updateData.avatar_url = updates.avatarUrl;
    }

    if (updates.status !== undefined) {
      updateData.status = updates.status;
      updateData.last_seen = new Date();
    }

    if (updates.publicKey !== undefined) {
      updateData.public_key = updates.publicKey;
    }

    if (updates.privateKey !== undefined) {
      updateData.private_key = updates.privateKey;
    }

    const [user] = await db('users')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return user ? this.mapDbUserToUser(user) : null;
  }

  /**
   * Update last seen timestamp
   */
  static async updateLastSeen(id: string): Promise<void> {
    await db('users').where('id', id).update({
      last_seen: new Date(),
      updated_at: new Date(),
    });
  }

  /**
   * Get user public profile
   */
  static async getPublicProfile(id: string): Promise<UserPublic | null> {
    const user = await db('users')
      .where('id', id)
      .select('id', 'username', 'avatar_url', 'status', 'last_seen')
      .first();

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      status: user.status,
      lastSeen: user.last_seen,
    };
  }

  /**
   * Search users by username
   */
  static async searchUsers(
    query: string,
    limit: number = 20
  ): Promise<UserPublic[]> {
    const users = await db('users')
      .where('username', 'like', `%${query.toLowerCase()}%`)
      .select('id', 'username', 'avatar_url', 'status', 'last_seen')
      .limit(limit);

    return users.map(this.mapDbUserToPublicUser);
  }

  /**
   * Delete user
   */
  static async delete(id: string): Promise<boolean> {
    const deletedCount = await db('users').where('id', id).del();
    return deletedCount > 0;
  }

  /**
   * Create user session
   */
  static async createSession(
    sessionData: CreateSessionRequest
  ): Promise<UserSession> {
    const sessionId = EncryptionService.generateUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const [session] = await db('user_sessions')
      .insert({
        id: sessionId,
        user_id: sessionData.userId,
        token_hash: sessionData.tokenHash,
        device_info: sessionData.deviceInfo,
        ip_address: sessionData.ipAddress,
        expires_at: expiresAt,
        created_at: new Date(),
      })
      .returning('*');

    return this.mapDbSessionToSession(session);
  }

  /**
   * Find session by token hash
   */
  static async findSessionByTokenHash(
    tokenHash: string
  ): Promise<UserSession | null> {
    const session = await db('user_sessions')
      .where('token_hash', tokenHash)
      .andWhere('expires_at', '>', new Date())
      .first();

    return session ? this.mapDbSessionToSession(session) : null;
  }

  /**
   * Delete user session
   */
  static async deleteSession(sessionId: string): Promise<boolean> {
    const deletedCount = await db('user_sessions').where('id', sessionId).del();
    return deletedCount > 0;
  }

  /**
   * Delete all user sessions
   */
  static async deleteAllUserSessions(userId: string): Promise<number> {
    return await db('user_sessions').where('user_id', userId).del();
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    return await db('user_sessions')
      .where('expires_at', '<=', new Date())
      .del();
  }

  /**
   * Map database user to User model
   */
  private static mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      passwordHash: dbUser.password_hash,
      avatarUrl: dbUser.avatar_url,
      status: dbUser.status,
      lastSeen: new Date(dbUser.last_seen),
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      publicKey: dbUser.public_key,
      privateKey: dbUser.private_key,
    };
  }

  /**
   * Map database user to public user
   */
  private static mapDbUserToPublicUser(dbUser: any): UserPublic {
    return {
      id: dbUser.id,
      username: dbUser.username,
      avatarUrl: dbUser.avatar_url,
      status: dbUser.status,
      lastSeen: new Date(dbUser.last_seen),
    };
  }

  /**
   * Map database session to UserSession model
   */
  private static mapDbSessionToSession(dbSession: any): UserSession {
    return {
      id: dbSession.id,
      userId: dbSession.user_id,
      tokenHash: dbSession.token_hash,
      deviceInfo: dbSession.device_info,
      ipAddress: dbSession.ip_address,
      expiresAt: new Date(dbSession.expires_at),
      createdAt: new Date(dbSession.created_at),
    };
  }
}
