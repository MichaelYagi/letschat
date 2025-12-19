import db from './connection';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Starting database migrations...');
    
    // Ensure migrations table exists
    await db.raw(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration VARCHAR(255) PRIMARY KEY,
        run_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', '');
      
      // Check if migration has already run
      const existing = await db('schema_migrations')
        .where('migration', migrationName)
        .first();
      
      if (existing) {
        logger.info(`Skipping migration ${migrationName} (already run)`);
        continue;
      }
      
      logger.info(`Running migration ${migrationName}...`);
      
      const migrationSQL = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf8'
      );
      
      await db.raw(migrationSQL);
      
      await db('schema_migrations').insert({
        migration: migrationName,
        run_at: new Date(),
      });
      
      logger.info(`Migration ${migrationName} completed successfully`);
    }
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
};

export const rollbackMigration = async (migrationName: string): Promise<void> => {
  try {
    logger.info(`Rolling back migration ${migrationName}...`);
    
    // Remove migration record
    await db('schema_migrations')
      .where('migration', migrationName)
      .del();
    
    logger.info(`Migration ${migrationName} rolled back successfully`);
  } catch (error) {
    logger.error(`Rollback failed for ${migrationName}:`, error);
    throw error;
  }
};

export const getMigrationStatus = async (): Promise<any[]> => {
  try {
    return await db('schema_migrations').orderBy('run_at', 'desc');
  } catch (error) {
    logger.error('Failed to get migration status:', error);
    throw error;
  }
};