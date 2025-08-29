const express = require('express');
const router = express.Router();
const FmeaController = require('../controllers/FmeaController');
const validateRequest = require('../middleware/validateRequest');
const { authenticate, checkPermission } = require('../middleware/permissions');

// Aplicar autenticação em todas as rotas
router.use(authenticate);

router.get('/', checkPermission('view_fmea'), FmeaController.index);
router.post('/', checkPermission('create_fmea'), validateRequest('createFmea'), FmeaController.create);
router.get('/:id', checkPermission('view_fmea'), FmeaController.show);
router.put('/:id', checkPermission('edit_fmea'), validateRequest('updateFmea'), FmeaController.update);
router.delete('/:id', checkPermission('delete_fmea'), FmeaController.destroy);

module.exports = router;