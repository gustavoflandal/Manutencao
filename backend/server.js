require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { 
  performanceMiddleware, 
  accessLogMiddleware, 
  errorCaptureMiddleware, 
  memoryMonitorMiddleware 
} = require('./middleware/performance');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  credentials: true
}));
app.use(compression());

// Middlewares de performance e monitoramento
app.use(memoryMonitorMiddleware);
app.use(performanceMiddleware);
app.use(accessLogMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use('/api/', limiter);

// Middlewares parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static('uploads'));

// Rotas da API
app.use('/api', routes);

// Middleware de captura de erros (antes do errorHandler)
app.use(errorCaptureMiddleware);

// Middleware de tratamento de erros
app.use(errorHandler);

// Inicialização do servidor
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Conexão com banco de dados estabelecida');
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
      console.log(`📍 API disponível em http://localhost:${PORT}/api`);
      console.log(`📋 Servidor ouvindo em todas as interfaces na porta ${PORT}`);
    });
    
    server.on('error', (err) => {
      console.error('❌ Erro no servidor:', err);
      logger.error('Erro no servidor:', err);
    });
  } catch (error) {
    logger.error('Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido. Fechando servidor...');
  await sequelize.close();
  process.exit(0);
});