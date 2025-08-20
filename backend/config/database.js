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
    // Apenas logs críticos em produção
    if (process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true') {
      logger.debug(sql);
    }
    // Em produção, logar apenas queries que demoram muito
    else if (process.env.NODE_ENV === 'production') {
      // Medir tempo da query e logar apenas se demorar muito
      const start = Date.now();
      return () => {
        const duration = Date.now() - start;
        if (duration > 1000) { // Queries que demoram mais de 1 segundo
          logger.warn(`Slow query detected (${duration}ms): ${sql.substring(0, 100)}...`);
        }
      };
    }
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

module.exports = sequelize;