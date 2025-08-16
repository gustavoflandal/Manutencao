const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Rota pública para listar categorias ativas (para uso em selects)
router.get('/active', CategoryController.listActive);

// Middleware de autenticação obrigatório para as demais rotas
router.use(authenticate);

// Rotas administrativas - só administradores
router.use(requireRole('administrador'));

// Rotas CRUD
router.get('/', CategoryController.index);
router.get('/:id', CategoryController.show);
router.post('/', CategoryController.store);
router.put('/:id', CategoryController.update);
router.delete('/:id', CategoryController.destroy);

module.exports = router;