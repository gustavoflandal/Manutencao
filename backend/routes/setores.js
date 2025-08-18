const express = require('express');
const router = express.Router();
const SetorController = require('../controllers/SetorController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireAnyRole } = require('../middleware/permissions');

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas públicas (todos os usuários autenticados)
router.get('/ativos', SetorController.ativos); // Para dropdowns

// Rotas que requerem pelo menos perfil técnico
router.get('/', requireAnyRole(['tecnico', 'supervisor', 'administrador']), SetorController.index);
router.get('/:id', requireAnyRole(['tecnico', 'supervisor', 'administrador']), SetorController.show);
router.get('/:id/stats', requireAnyRole(['tecnico', 'supervisor', 'administrador']), SetorController.stats);

// Rotas que requerem perfil supervisor ou administrador
router.post('/', requireAnyRole(['supervisor', 'administrador']), SetorController.store);
router.put('/:id', requireAnyRole(['supervisor', 'administrador']), SetorController.update);

// Rotas que requerem apenas administrador
router.delete('/:id', requireRole('administrador'), SetorController.destroy);

module.exports = router;