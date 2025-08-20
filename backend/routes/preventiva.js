const express = require('express');
const router = express.Router();
const PlanoPreventivosController = require('../controllers/PlanoPreventivosController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Listar planos preventivos com filtros e paginação
router.get('/', 
  requireRole('tecnico'),
  PlanoPreventivosController.index
);

// Obter estatísticas dos planos preventivos
router.get('/stats', 
  requireRole('tecnico'),
  PlanoPreventivosController.stats
);

// Obter dados para gráfico de Gantt
router.get('/gantt', 
  requireRole('tecnico'),
  PlanoPreventivosController.gantt
);

// Obter calendário de manutenções
router.get('/calendario', 
  requireRole('tecnico'),
  PlanoPreventivosController.calendario
);

// Relatório de eficiência da manutenção preventiva
router.get('/relatorio/eficiencia', 
  requireRole('supervisor'),
  PlanoPreventivosController.relatorioEficiencia
);

// Sugerir otimizações nos planos preventivos
router.get('/otimizacoes/sugestoes', 
  requireRole('supervisor'),
  PlanoPreventivosController.sugerirOtimizacoes
);

// Obter planos por status de vencimento
router.get('/status/:status', 
  requireRole('tecnico'),
  PlanoPreventivosController.porStatus
);

// Buscar um plano preventivo específico
router.get('/:id', 
  requireRole('tecnico'),
  PlanoPreventivosController.show
);

// Criar novo plano preventivo
router.post('/', 
  requireRole('tecnico'),
  PlanoPreventivosController.store
);

// Gerar ordens de serviço automaticamente para planos vencidos
router.post('/gerar-ordens-automaticas', 
  requireRole('tecnico'),
  PlanoPreventivosController.gerarOrdensAutomaticas
);

// Atualizar planos baseados em métricas (horas/contador)
router.post('/atualizar-metricas', 
  requireRole('tecnico'),
  PlanoPreventivosController.atualizarPlanosMetricas
);

// Atualizar plano preventivo
router.put('/:id', 
  requireRole('tecnico'),
  PlanoPreventivosController.update
);

// Marcar execução de um plano preventivo
router.post('/:id/executar', 
  requireRole('tecnico'),
  PlanoPreventivosController.marcarExecucao
);

// Excluir plano preventivo
router.delete('/:id', 
  requireRole('supervisor'),
  PlanoPreventivosController.destroy
);

module.exports = router;
