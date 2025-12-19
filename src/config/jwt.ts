import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './index';

export interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string => {
  // @ts-ignore - JWT types are being difficult
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'letschat',
    audience: 'letschat-users',
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'letschat',
    audience: 'letschat-users',
  }) as JWTPayload;
};

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}