const express = require('express');
const router = express.Router();
const SolicitacaoController = require('../controllers/SolicitacaoController');
const { authenticate } = require('../middleware/auth');

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas principais
router.get('/', SolicitacaoController.index);
router.get('/stats', SolicitacaoController.stats);
router.get('/:id', SolicitacaoController.show);
router.post('/', SolicitacaoController.store);
router.put('/:id', SolicitacaoController.update);

// Rotas específicas
router.patch('/:id/cancel', SolicitacaoController.cancel);
router.patch('/:id/assign', SolicitacaoController.assignResponsible);

module.exports = router;
