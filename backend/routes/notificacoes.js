const express = require('express');
const router = express.Router();
const NotificacaoController = require('../controllers/NotificacaoController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rotas de notificações
router.get('/', NotificacaoController.listar);
router.get('/contar-nao-lidas', NotificacaoController.contarNaoLidas);
router.get('/estatisticas', NotificacaoController.estatisticas);
router.get('/configuracoes', NotificacaoController.obterConfiguracoes);
router.get('/:id', NotificacaoController.obter);

router.post('/', requireRole('tecnico'), NotificacaoController.criar);
router.post('/teste', requireRole('administrador'), NotificacaoController.testeNotificacao);

router.put('/:id/marcar-lida', NotificacaoController.marcarLida);
router.put('/marcar-varias-lidas', NotificacaoController.marcarVariasLidas);
router.put('/marcar-todas-lidas', NotificacaoController.marcarTodasLidas);
router.put('/configuracoes', NotificacaoController.atualizarConfiguracoes);
router.put('/pausar', NotificacaoController.pausarNotificacoes);
router.put('/reativar', NotificacaoController.reativarNotificacoes);

router.delete('/:id', NotificacaoController.deletar);

module.exports = router;