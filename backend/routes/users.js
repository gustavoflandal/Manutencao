const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireOwnershipOrAdmin } = require('../middleware/permissions');

// Rotas que requerem autenticação
router.use(authenticate);

// Perfil do usuário logado
router.get('/profile', UserController.profile);
router.put('/profile', UserController.updateProfile);

// Listagem de usuários (apenas supervisores e administradores)
router.get('/', requireRole('supervisor'), UserController.index);

// Visualizar usuário específico (próprio perfil ou admin/supervisor)
router.get('/:id', requireOwnershipOrAdmin(), UserController.show);

// Criar usuário (apenas administradores)
router.post('/', requireRole('administrador'), UserController.store);

// Atualizar usuário (próprio perfil ou admin)
router.put('/:id', requireOwnershipOrAdmin(), UserController.update);

// Excluir usuário (apenas administradores)
router.delete('/:id', requireRole('administrador'), UserController.destroy);

// Resetar senha (apenas administradores)
router.post('/:id/reset-password', requireRole('administrador'), UserController.resetPassword);

module.exports = router;
