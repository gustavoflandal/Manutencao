const express = require('express');
const router = express.Router();
// Temporariamente usar controller original para testes
const AtivoController = require('../controllers/AtivoController');
const SimpleUploadController = require('../controllers/SimpleUploadController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Rota pública para download de imagens (sem autenticação)
router.get('/:id/imagens/:filename/download', SimpleUploadController.downloadImagem.bind(SimpleUploadController));

// Middleware de autenticação para todas as outras rotas
router.use(authenticate);

// Rotas públicas (somente autenticação)
router.get('/select', AtivoController.listForSelect);
router.get('/stats', AtivoController.stats);
router.get('/level/stats', AtivoController.estatisticasLevel);
// Rota nova para estatísticas de imagens (substitui rota legacy /level/stats)
router.get('/imagens/stats', AtivoController.estatisticasLevel);

// Rotas que requerem permissão de visualização (todos os usuários autenticados)
router.get('/', AtivoController.index);
router.get('/by-setor/:id', AtivoController.bySetor);

router.get('/codigo/:codigo', AtivoController.buscarPorCodigo);

router.get('/:id', AtivoController.show);

// Rotas que requerem permissão de criação (técnico ou superior)
router.post('/', requireRole('tecnico'), AtivoController.store);

// Rotas que requerem permissão de edição (técnico ou superior)
router.put('/:id', requireRole('tecnico'), AtivoController.update);

// Rotas de imagens - usando controller simples (arquivo físico)
router.post('/:id/imagens', requireRole('tecnico'), 
  SimpleUploadController.getUploadMiddleware(), 
  SimpleUploadController.uploadImagens.bind(SimpleUploadController)
);
router.get('/:id/imagens', AtivoController.listarImagens);
router.delete('/:id/imagens/:imagemId', requireRole('tecnico'), SimpleUploadController.removerImagem.bind(SimpleUploadController));

// Rotas que requerem permissão de exclusão (supervisor ou superior)
router.delete('/:id', requireRole('supervisor'), AtivoController.destroy);

module.exports = router;
