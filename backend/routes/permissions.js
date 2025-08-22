const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/permissions');
const PermissionController = require('../controllers/PermissionController');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar módulos únicos das permissões (antes de /:id para evitar conflito)
router.get('/modules', 
  requireRole(['supervisor', 'administrador']), 
  PermissionController.modules
);

// Listar todas as permissões (apenas supervisor e admin)
router.get('/', 
  requireRole(['supervisor', 'administrador']), 
  PermissionController.index
);

// Obter uma permissão específica (depois das rotas estáticas)
router.get('/:id', 
  requireRole(['supervisor', 'administrador']), 
  PermissionController.show
);

// Criar nova permissão (apenas admin)
router.post('/', 
  requireRole('administrador'), 
  PermissionController.store
);

// Atualizar permissão (apenas admin)
router.put('/:id', 
  requireRole('administrador'), 
  PermissionController.update
);

// Excluir permissão (apenas admin)
router.delete('/:id', 
  requireRole('administrador'), 
  PermissionController.destroy
);

// Atribuir permissão a um usuário (apenas admin)
router.post('/assign', 
  requireRole('administrador'), 
  PermissionController.assignToUser
);

// Remover permissão de um usuário (apenas admin)
router.post('/revoke', 
  requireRole('administrador'), 
  PermissionController.revokeFromUser
);

module.exports = router;