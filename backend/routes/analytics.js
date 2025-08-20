const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/AnalyticsController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// ==================== MÉTRICAS ====================

// Listar métricas
router.get('/metricas', 
  authenticate, 
  requireRole('tecnico'),
  AnalyticsController.listarMetricas
);

// Obter KPIs principais
router.get('/kpis', 
  authenticate, 
  requireRole('tecnico'),
  AnalyticsController.obterKPIs
);

// Criar métrica
router.post('/metricas', 
  authenticate, 
  requireRole('supervisor'),
  AnalyticsController.criarMetrica
);

// Estatísticas gerais
router.get('/estatisticas', 
  authenticate, 
  requireRole('tecnico'),
  AnalyticsController.obterEstatisticasGerais
);

// ==================== DASHBOARDS ====================

// Listar dashboards
router.get('/dashboards', 
  authenticate, 
  requireRole('tecnico'),
  AnalyticsController.listarDashboards
);

// Criar dashboard
router.post('/dashboards', 
  authenticate, 
  requireRole('supervisor'),
  AnalyticsController.criarDashboard
);

// Obter dashboard específico
router.get('/dashboards/:id', 
  authenticate, 
  requireRole('tecnico'),
  AnalyticsController.obterDashboard
);

// Atualizar dashboard
router.put('/dashboards/:id', 
  authenticate, 
  requireRole('supervisor'),
  AnalyticsController.atualizarDashboard
);

// ==================== RELATÓRIOS ====================

// Listar relatórios
router.get('/relatorios', 
  authenticate, 
  requireRole('tecnico'),
  AnalyticsController.listarRelatorios
);

// Criar relatório
router.post('/relatorios', 
  authenticate, 
  requireRole('supervisor'),
  AnalyticsController.criarRelatorio
);

// Executar relatório
router.post('/relatorios/:id/executar', 
  authenticate, 
  requireRole('tecnico'),
  AnalyticsController.executarRelatorio
);

// Obter execuções de relatório
router.get('/relatorios/:id/execucoes', 
  authenticate, 
  requireRole('tecnico'),
  AnalyticsController.obterExecucoesRelatorio
);

// ==================== DASHBOARD PRINCIPAL ====================

// Dashboard principal de analytics
router.get('/dashboard', 
  authenticate, 
  requireRole('tecnico'),
  AnalyticsController.obterDashboardAnalytics
);

module.exports = router;