const express = require('express');
const router = express.Router();
const AtivoController = require('../controllers/AtivoController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas públicas (somente autenticação)
router.get('/select', AtivoController.listForSelect);
router.get('/stats', AtivoController.stats);

// Rotas que requerem permissão de visualização (todos os usuários autenticados)
router.get('/', AtivoController.index);

router.get('/codigo/:codigo', AtivoController.buscarPorCodigo);

router.get('/:id', AtivoController.show);

// Rotas que requerem permissão de criação (técnico ou superior)
router.post('/', requireRole('tecnico'), AtivoController.store);

// Rotas que requerem permissão de edição (técnico ou superior)
router.put('/:id', requireRole('tecnico'), AtivoController.update);

// Rotas de imagens
router.post('/:id/imagens', requireRole('tecnico'), AtivoController.uploadImagens);
router.get('/:id/imagens', AtivoController.listarImagens);
router.delete('/:id/imagens/:imagemId', requireRole('tecnico'), AtivoController.removerImagem);
router.put('/:id/imagens/:imagemId/ordem', requireRole('tecnico'), AtivoController.atualizarOrdemImagem);

// Rotas que requerem permissão de exclusão (supervisor ou superior)
router.delete('/:id', requireRole('supervisor'), AtivoController.destroy);

// Rotas especializadas para manutenção avançada
router.post('/:id/qrcode', requireRole('tecnico'), AtivoController.regenerateQRCode);
router.get('/:id/metrics', AtivoController.calculateMaintenanceMetrics);
router.put('/:id/parameters', requireRole('tecnico'), AtivoController.updateOperationParameters);
router.post('/:id/failures', requireRole('tecnico'), AtivoController.addFailureRecord);

module.exports = router;
