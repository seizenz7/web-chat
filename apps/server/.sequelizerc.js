/**
 * Sequelize CLI Configuration
 *
 * This file tells sequelize-cli how to find and run migrations.
 */

const path = require('path');

module.exports = {
  // Path to models directory
  models_path: path.join(__dirname, 'src', 'database', 'models'),
  
  // Path to migrations directory  
  migrations_path: path.join(__dirname, 'src', 'database', 'migrations'),
  
  // Path to seeders directory
  seeders_path: path.join(__dirname, 'src', 'database', 'seeders'),
  
  // Database configuration
  config: path.join(__dirname, 'src', 'database', 'config', 'database.js'),
};
