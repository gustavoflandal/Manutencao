const express = require('express');
const router = express.Router();
const OrdemServicoController = require('../controllers/OrdemServicoController');
const validateRequest = require('../middleware/validateRequest');
const { authenticate, checkPermission } = require('../middleware/permissions');

// Aplicar autenticação em todas as rotas
router.use(authenticate);

router.get('/', checkPermission('view_os'), OrdemServicoController.index);
router.post('/', checkPermission('create_os'), validateRequest('createOrdemServico'), OrdemServicoController.create);
router.get('/:id', checkPermission('view_os'), OrdemServicoController.show);
router.put('/:id', checkPermission('edit_os'), validateRequest('updateOrdemServico'), OrdemServicoController.update);
router.delete('/:id', checkPermission('delete_os'), OrdemServicoController.destroy);

module.exports = router;