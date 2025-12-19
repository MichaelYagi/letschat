import { runMigrations, getMigrationStatus } from './migrate';
import { pingDatabase } from './ping';
import { logger } from '../utils/logger';

const runMigrationsCLI = async () => {
  try {
    console.log('Checking database connection...');
    const isDbConnected = await pingDatabase();
    
    if (!isDbConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    console.log('Running migrations...');
    
    await runMigrations();
    
    console.log('✅ All migrations completed successfully');
    
    const status = await getMigrationStatus();
    console.log(`\nMigration status (${status.length} migrations run):`);
    status.forEach(migration => {
      console.log(`  - ${migration.migration} at ${migration.run_at}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

const pingDatabaseCLI = async () => {
  try {
    const isDbConnected = await pingDatabase();
    
    if (isDbConnected) {
      console.log('✅ Database connection successful');
      process.exit(0);
    } else {
      console.log('❌ Database connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Database ping failed:', error);
    process.exit(1);
  }
};

const statusDatabaseCLI = async () => {
  try {
    const isDbConnected = await pingDatabase();
    
    if (!isDbConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    const status = await getMigrationStatus();
    
    console.log('✅ Database connection successful');
    console.log(`\nMigration status (${status.length} migrations run):`);
    
    if (status.length === 0) {
      console.log('  No migrations have been run');
    } else {
      status.forEach(migration => {
        console.log(`  - ${migration.migration} at ${migration.run_at}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  }
};

// CLI handler
const command = process.argv[2];

switch (command) {
  case 'migrate':
    runMigrationsCLI();
    break;
  case 'ping':
    pingDatabaseCLI();
    break;
  case 'status':
    statusDatabaseCLI();
    break;
  default:
    console.log('Usage: node dist/database/cli.js [migrate|ping|status]');
    process.exit(1);
}