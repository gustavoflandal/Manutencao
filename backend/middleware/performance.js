const logger = require('../config/logger');

/**
 * Middleware para monitoramento de performance das APIs
 * Registra tempo de resposta e identifica endpoints lentos
 */
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Interceptar o response para calcular tempo
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;
    const contentLength = Buffer.byteLength(data || '', 'utf8');

    // Log de performance baseado no tempo de resposta
    if (duration > 2000) {
      // Requests muito lentos (>2s)
      logger.error('Slow API Response', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        contentLength: `${contentLength} bytes`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      });
    } else if (duration > 1000) {
      // Requests lentos (>1s)
      logger.warn('Slow API Response', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        contentLength: `${contentLength} bytes`
      });
    } else if (process.env.NODE_ENV === 'development' && process.env.LOG_API_PERF === 'true') {
      // Em desenvolvimento, log de todos os requests se habilitado
      logger.info('API Response', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`
      });
    }

    // Adicionar header de performance
    res.set('X-Response-Time', `${duration}ms`);

    // Chamar o send original
    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para log de acesso (apenas em desenvolvimento)
 */
const accessLogMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && process.env.LOG_ACCESS === 'true') {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent');
    
    logger.debug('API Access', {
      method,
      url: originalUrl,
      ip: ip || req.connection.remoteAddress,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Middleware para capturar erros não tratados
 */
const errorCaptureMiddleware = (err, req, res, next) => {
  const { method, originalUrl, ip } = req;
  
  logger.error('Unhandled API Error', {
    error: err.message,
    stack: err.stack,
    method,
    url: originalUrl,
    ip: ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  next(err);
};

/**
 * Middleware para monitorar uso de memória
 */
const memoryMonitorMiddleware = (req, res, next) => {
  // Executar apenas a cada 100 requests para não impactar performance
  if (Math.random() < 0.01) { // 1% das requests
    const memUsage = process.memoryUsage();
    const memMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    // Log apenas se uso de memória for alto
    if (memMB.heapUsed > 512) { // Mais de 512MB de heap usado
      logger.warn('High Memory Usage', {
        memory: memMB,
        uptime: `${Math.round(process.uptime())}s`
      });
    } else if (process.env.NODE_ENV === 'development' && process.env.LOG_MEMORY === 'true') {
      logger.info('Memory Usage', { memory: memMB });
    }
  }
  
  next();
};

/**
 * Função para log de operações críticas de negócio
 */
const logBusinessOperation = (operation, userId, details = {}) => {
  logger.audit(operation, userId, {
    type: 'business_operation',
    ...details
  });
};

/**
 * Função para log de operações de segurança
 */
const logSecurityEvent = (event, userId, details = {}) => {
  logger.warn('Security Event', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    type: 'security',
    ...details
  });
};

module.exports = {
  performanceMiddleware,
  accessLogMiddleware,
  errorCaptureMiddleware,
  memoryMonitorMiddleware,
  logBusinessOperation,
  logSecurityEvent
};