import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
        status?: string;
      };
    }
  }
}

export {};
