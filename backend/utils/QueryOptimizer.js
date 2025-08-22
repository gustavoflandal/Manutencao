const { QueryTypes, Transaction } = require('sequelize');
const { sequelize } = require('../models');
const logger = require('../config/logger');

/**
 * Utilitários para otimização de consultas ao banco de dados
 */
class QueryOptimizer {
  
  /**
   * Executa uma consulta com monitoramento de performance
   */
  static async executeWithMonitoring(query, options = {}) {
    const startTime = Date.now();
    
    try {
      const result = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        ...options
      });
      
      const duration = Date.now() - startTime;
      
      // Log apenas consultas lentas
      if (duration > 500) {
        logger.warn('Slow Database Query', {
          query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
          duration: `${duration}ms`,
          recordCount: Array.isArray(result) ? result.length : 1
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Database Query Error', {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration: `${duration}ms`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Otimiza consultas com paginação
   */
  static getPaginationOptions(page = 1, limit = 10, maxLimit = 100) {
    const normalizedPage = Math.max(1, parseInt(page) || 1);
    const normalizedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 10));
    const offset = (normalizedPage - 1) * normalizedLimit;
    
    return {
      limit: normalizedLimit,
      offset,
      page: normalizedPage
    };
  }

  /**
   * Constrói filtros de busca otimizados
   */
  static buildSearchFilter(searchTerm, fields = []) {
    if (!searchTerm || !fields.length) return {};
    
    const { Op } = require('sequelize');
    
    // Para campos múltiplos, usar OR
    if (fields.length > 1) {
      return {
        [Op.or]: fields.map(field => ({
          [field]: {
            [Op.like]: `%${searchTerm}%`
          }
        }))
      };
    }
    
    // Para campo único
    return {
      [fields[0]]: {
        [Op.like]: `%${searchTerm}%`
      }
    };
  }

  /**
   * Otimiza includes para evitar N+1 queries
   */
  static optimizeIncludes(includes = []) {
    return includes.map(include => {
      if (typeof include === 'string') {
        return { association: include, required: false };
      }
      
      return {
        required: false,
        ...include,
        // Adiciona subQuery: false para otimizar
        subQuery: false
      };
    });
  }

  /**
   * Constrói ordenação segura
   */
  static buildSafeOrder(orderBy, direction = 'ASC', validFields = []) {
    // Verificar se o campo é válido
    if (!orderBy || !validFields.includes(orderBy)) {
      return [['id', 'DESC']]; // Ordenação padrão
    }
    
    const safeDirection = ['ASC', 'DESC'].includes(direction.toUpperCase()) 
      ? direction.toUpperCase() 
      : 'ASC';
    
    return [[orderBy, safeDirection]];
  }

  /**
   * Cache simples para consultas frequentes (em memória)
   */
  static cache = new Map();
  static cacheTimeout = 5 * 60 * 1000; // 5 minutos
  
  static async getCached(key, queryFunction) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const data = await queryFunction();
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limpar cache antigo
    this.clearOldCache();
    
    return data;
  }
  
  static clearOldCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
  
  static clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Analisa performance das consultas mais comuns
   */
  static async analyzeCommonQueries() {
    const queries = [
      {
        name: 'Count Users',
        query: 'SELECT COUNT(*) as total FROM Users WHERE deletedAt IS NULL'
      },
      {
        name: 'Count Solicitacoes',
        query: 'SELECT COUNT(*) as total FROM Solicitacoes WHERE deletedAt IS NULL'
      },
      {
        name: 'Count Categories',
        query: 'SELECT COUNT(*) as total FROM Categories WHERE deletedAt IS NULL'
      },
      {
        name: 'Active Users',
        query: 'SELECT COUNT(*) as total FROM Users WHERE deletedAt IS NULL AND active = true'
      }
    ];
    
    const results = [];
    
    for (const { name, query } of queries) {
      const startTime = Date.now();
      
      try {
        await sequelize.query(query, { type: QueryTypes.SELECT });
        const duration = Date.now() - startTime;
        
        results.push({
          name,
          duration: `${duration}ms`,
          status: 'success'
        });
      } catch (error) {
        results.push({
          name,
          duration: '0ms',
          status: 'error',
          error: error.message
        });
      }
    }
    
    logger.info('Database Performance Analysis', { queries: results });
    
    return results;
  }

  /**
   * Monitora conexões ativas do banco
   */
  static async getConnectionStats() {
    try {
      const pool = sequelize.connectionManager.pool;
      
      const stats = {
        total: pool._count,
        active: pool._draining,
        idle: pool._idle,
        waiting: pool._pendingCreates.length,
        max: pool.options.max,
        min: pool.options.min
      };
      
      // Log se muitas conexões ativas
      if (stats.active > stats.max * 0.8) {
        logger.warn('High Database Connection Usage', stats);
      }
      
      return stats;
    } catch (error) {
      logger.error('Error getting connection stats', { error: error.message });
      return null;
    }
  }
}

/**
 * Helper para transações otimizadas
 */
class TransactionHelper {
  
  static async executeInTransaction(callback, options = {}) {
    const { isolationLevel, ...txOptions } = options;
    const transaction = await sequelize.transaction({
      isolationLevel: isolationLevel || Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      ...txOptions
    });
    
    const startTime = Date.now();
    
    try {
      const result = await callback(transaction);
      await transaction.commit();
      
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        logger.warn('Long Transaction', {
          duration: `${duration}ms`
        });
      }
      
      return result;
    } catch (error) {
      await transaction.rollback();
      
      const duration = Date.now() - startTime;
      logger.error('Transaction Failed', {
        duration: `${duration}ms`,
        error: error.message
      });
      
      throw error;
    }
  }
}

module.exports = {
  QueryOptimizer,
  TransactionHelper
};