/**
 * Sequelize Database Configuration
 *
 * This file configures Sequelize for migrations and CLI operations.
 * It's used by sequelize-cli for running migrations and managing the database.
 */

require('dotenv').config();

module.exports = {
  // Development environment configuration
  development: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pern_dev',
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true, // Use snake_case for column names
      timestamps: true, // Add createdAt and updatedAt columns
      paranoid: false, // Don't use soft deletes by default
    },
  },

  // Test environment configuration
  test: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pern_test',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
      paranoid: false,
    },
  },

  // Production environment configuration
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
      paranoid: false,
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false,
      } : false,
    },
  },
};