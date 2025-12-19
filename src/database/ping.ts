import db from './connection';
import { logger } from '../utils/logger';

export const pingDatabase = async (): Promise<boolean> => {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection: OK');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};