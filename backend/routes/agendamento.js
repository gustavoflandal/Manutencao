const express = require('express');
const router = express.Router();
const AgendamentoController = require('../controllers/AgendamentoController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Obter status do serviço de agendamento
router.get('/status', 
  requireRole('supervisor'),
  AgendamentoController.status
);

// Iniciar serviço de agendamento automático
router.post('/iniciar', 
  requireRole('admin'),
  AgendamentoController.iniciar
);

// Parar serviço de agendamento automático
router.post('/parar', 
  requireRole('admin'),
  AgendamentoController.parar
);

// Executar verificação manual
router.post('/executar-manual', 
  requireRole('supervisor'),
  AgendamentoController.executarManual
);

module.exports = router;