const winston = require('winston');
const path = require('path');

// Definir nível de log baseado no ambiente
const getLogLevel = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'warn'; // Apenas warnings e erros em produção
    case 'test':
      return 'error'; // Apenas erros em testes
    default:
      return process.env.LOG_LEVEL || 'info'; // Desenvolvimento
  }
};

// Formato para produção (JSON estruturado)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(stack && { stack }),
      ...meta
    });
  })
);

// Formato para desenvolvimento (mais legível)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}`;
  })
);

// Configurar transports baseado no ambiente
const transports = [];

// Log de erros sempre ativo
transports.push(
  new winston.transports.File({ 
    filename: path.join('logs', 'error.log'), 
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: productionFormat
  })
);

// Log combinado apenas em desenvolvimento e produção
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: productionFormat
    })
  );
}

// Console apenas em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat
    })
  );
}

const logger = winston.createLogger({
  level: getLogLevel(),
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { 
    service: 'sistema-manutencao',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  // Configurações adicionais
  exitOnError: false, // Não encerrar processo em caso de erro no logger
  silent: process.env.NODE_ENV === 'test' && process.env.LOG_TESTS !== 'true'
});

// Método para log de performance
logger.perf = (message, startTime) => {
  const duration = Date.now() - startTime;
  if (duration > 100) { // Log apenas operações que demoram mais de 100ms
    logger.info(`[PERFORMANCE] ${message} - ${duration}ms`);
  }
};

// Método para log de auditoria
logger.audit = (action, userId, details = {}) => {
  logger.info('Audit', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

module.exports = logger;