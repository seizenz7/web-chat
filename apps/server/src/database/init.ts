/**
 * Database Initialization Script
 *
 * This script initializes the Sequelize connection and database setup.
 * It should be called during application startup to ensure database connectivity.
 */

import { Sequelize } from 'sequelize';
import { config } from '../../config';

let sequelize: Sequelize | undefined;

/**
 * Initialize Sequelize connection
 * Uses DATABASE_URL if available, otherwise individual DB config values
 */
export const initializeDatabase = async (): Promise<Sequelize> => {
  if (sequelize) {
    return sequelize;
  }

  try {
    const databaseUrl = config.database.url || `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`;

    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: config.isDev ? console.log : false,
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        underscored: true,
        timestamps: true,
        paranoid: false, // Set to true for soft deletes if needed
      },
      dialectOptions: {
        ssl: config.isProd ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
      },
    });

    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Get Sequelize instance
 */
export const getSequelize = (): Sequelize => {
  if (!sequelize) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return sequelize;
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (sequelize) {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
};

export default sequelize;