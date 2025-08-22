const express = require('express');
const router = express.Router();
const { authenticate, checkPermission, requireRole } = require('../middleware/permissions');
const FmeaController = require('../controllers/FmeaController');

// Todas as rotas requerem autenticação
router.use(authenticate);
const { checkPermission } = require('../middleware/permissions');
  FmeaController.index
);

// Criar nova análise FMEA
router.post('/',
  checkPermission('create_fmea'),
  FmeaController.create
);

// Obter detalhes de uma análise FMEA
router.get('/:id',
  checkPermission('view_fmea'),
  FmeaController.get
);

// Atualizar análise FMEA
router.put('/:id',
  checkPermission('edit_fmea'),
  FmeaController.update
);

// Adicionar ação a uma análise FMEA
router.post('/:id/actions',
  checkPermission('edit_fmea'),
  FmeaController.addAction
);

// Obter análises críticas
router.get('/reports/critical',
  checkPermission('view_fmea_reports'),
  FmeaController.getCriticalAnalyses
);

// Obter estatísticas
router.get('/reports/statistics',
  checkPermission('view_fmea_reports'),
  FmeaController.getStatistics
);

// Arquivo legado: rotas FMEA foram migradas para fmea-routes.js
module.exports = require('./fmea-routes');