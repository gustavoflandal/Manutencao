const express = require('express');
const router = express.Router();
const PermissionController = require('../controllers/PermissionController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar todas as permissões (supervisores e administradores)
router.get('/', requireRole('supervisor'), PermissionController.index);

// Listar módulos disponíveis
router.get('/modules', requireRole('supervisor'), PermissionController.getModules);

// Criar nova permissão (apenas administradores)
router.post('/', requireRole('administrador'), PermissionController.store);

// Rotas relacionadas a usuários e permissões
router.get('/users/:userId', requireRole('supervisor'), PermissionController.getUserPermissions);
router.post('/users/:userId/grant', requireRole('administrador'), PermissionController.grantPermission);
router.delete('/users/:userId/:permissionId', requireRole('administrador'), PermissionController.revokePermission);
router.put('/users/:userId', requireRole('administrador'), PermissionController.updateUserPermissions);

module.exports = router;
