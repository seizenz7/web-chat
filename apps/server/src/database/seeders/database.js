/**
 * Database Connection for Seeders
 * 
 * Simple Sequelize connection setup for seeding operations.
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pern_dev',
  {
    dialect: 'postgres',
    logging: false, // Disable logging during seeding
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export { sequelize };

// Export all models for seeding
export { initializeModels } from '../models/associations.js';