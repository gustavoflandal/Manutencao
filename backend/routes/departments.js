const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/DepartmentController');
const { authenticate } = require('../middleware/auth');
const permissions = require('../middleware/permissions');

// Todas as rotas exigem autenticação
router.use(authenticate);

// GET /api/departments - Listar departamentos (todos os usuários logados)
router.get('/', DepartmentController.index);

// GET /api/departments/active - Listar apenas departamentos ativos (para selects)
router.get('/active', DepartmentController.active);

// GET /api/departments/:id - Buscar departamento específico
router.get('/:id', DepartmentController.show);

// POST /api/departments - Criar departamento (apenas supervisores e administradores)
router.post('/', 
  permissions.requireRole(['supervisor', 'administrador']),
  DepartmentController.store
);

// PUT /api/departments/:id - Atualizar departamento (apenas supervisores e administradores)
router.put('/:id', 
  permissions.requireRole(['supervisor', 'administrador']),
  DepartmentController.update
);

// DELETE /api/departments/:id - Desativar departamento (apenas administradores)
router.delete('/:id', 
  permissions.requireRole(['administrador']),
  DepartmentController.destroy
);

// PATCH /api/departments/:id/activate - Reativar departamento (apenas administradores)
router.patch('/:id/activate', 
  permissions.requireRole(['administrador']),
  DepartmentController.activate
);

module.exports = router;