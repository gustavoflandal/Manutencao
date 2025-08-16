const express = require('express');
const router = express.Router();
const SubCategoryController = require('../controllers/SubCategoryController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Rota pública para listar subcategorias por categoria (para uso em selects)
router.get('/by-category/:categoryId', SubCategoryController.byCategory);

// Middleware de autenticação obrigatório para as demais rotas
router.use(authenticate);

// Rotas administrativas - só administradores
router.use(requireRole('administrador'));

// Rotas CRUD
router.get('/', SubCategoryController.index);
router.get('/:id', SubCategoryController.show);
router.post('/', SubCategoryController.store);
router.put('/:id', SubCategoryController.update);
router.delete('/:id', SubCategoryController.destroy);

module.exports = router;