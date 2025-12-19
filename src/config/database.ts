import { config } from './index';

export const databaseConfig = {
  client: 'sqlite3',
  connection: {
    filename: config.database.url,
  },
  useNullAsDefault: true,
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/database/seeds',
  },
  pool: {
    min: 2,
    max: config.database.maxConnections,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
};
