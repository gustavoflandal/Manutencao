const express = require('express');
const FmeaController = require('../controllers/FmeaController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');
const logger = require('../config/logger');

const router = express.Router();

router.use(authenticate);

function ensure(name) {
  const fn = FmeaController[name];
  if (typeof fn !== 'function') {
    logger.error(`Handler FMEA não encontrado: ${name}`);
    return (req, res) => res.status(501).json({ success: false, message: `Handler não implementado: ${name}` });
  }
  return fn.bind(FmeaController);
}

router.get('/', requireRole('tecnico'), ensure('index'));
router.get('/estatisticas', requireRole('tecnico'), ensure('estatisticas'));
router.get('/:id', requireRole('tecnico'), ensure('show'));
router.post('/', requireRole('tecnico'), ensure('create'));
router.put('/:id', requireRole('tecnico'), ensure('update'));
router.delete('/:id', requireRole('supervisor'), ensure('destroy'));

module.exports = router;