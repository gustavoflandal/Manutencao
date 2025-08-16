const { Sequelize } = require('sequelize');
const logger = require('./logger');

// Carregar variáveis de ambiente
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'manutencao_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  pool: {
    max: 20,
    min: 5,
    idle: 30000,
    acquire: 60000,
  },
  logging: (sql) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(sql);
    }
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

module.exports = sequelize;