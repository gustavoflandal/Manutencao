// Configurar variáveis de ambiente para teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_DATABASE = 'manutencao_test';

// Silenciar logs durante os testes
const winston = require('winston');
winston.configure({
  transports: [
    new winston.transports.Console({
      silent: true
    })
  ]
});

