const express = require('express');
const router = express.Router();
const WorkflowController = require('../controllers/WorkflowController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Aplicar middleware de autenticação a todas as rotas
router.use(authenticate);

// ===== ROTAS DE WORKFLOWS =====

// Listar workflows
router.get('/', WorkflowController.listarWorkflows);

// Obter templates
router.get('/templates', WorkflowController.listarTemplates);

// Obter workflow específico
router.get('/:id', WorkflowController.obterWorkflow);

// Criar novo workflow
router.post('/', 
  requireRole('supervisor'),
  WorkflowController.criarWorkflow
);

// Criar templates padrão
router.post('/templates/padrao', 
  requireRole('administrador'),
  WorkflowController.criarTemplatesPadrao
);

// Atualizar workflow
router.put('/:id',
  requireRole('supervisor'),
  WorkflowController.atualizarWorkflow
);

// Deletar workflow
router.delete('/:id',
  requireRole('administrador'),
  WorkflowController.excluirWorkflow
);

// Obter estatísticas gerais
router.get('/estatisticas', WorkflowController.obterEstatisticasGerais);

// Executar ações automáticas
router.post('/acoes/automaticas',
  requireRole('administrador'),
  WorkflowController.executarAcoesAutomaticas
);

// Verificar workflows vencidos
router.post('/verificar-vencidos',
  requireRole('administrador'),
  WorkflowController.verificarWorkflowsVencidos
);

// ===== ROTAS DE INSTÂNCIAS =====

// Listar instâncias
router.get('/instancias', WorkflowController.listarInstancias);

// Criar instância
router.post('/instancias', 
  requireRole('tecnico'),
  WorkflowController.criarInstancia
);

// Obter instância específica
router.get('/instancias/:id', WorkflowController.obterInstancia);

// Pausar instância
router.post('/instancias/:id/pausar',
  requireRole('supervisor'),
  WorkflowController.pausarInstancia
);

// Reativar instância
router.post('/instancias/:id/reativar',
  requireRole('supervisor'),
  WorkflowController.reativarInstancia
);

// Adicionar comentário
router.post('/instancias/:id/comentario',
  requireRole('tecnico'),
  WorkflowController.adicionarComentario
);

module.exports = router;