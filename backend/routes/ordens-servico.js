const express = require('express');
const router = express.Router();
const OrdemServicoController = require('../controllers/OrdemServicoController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/permissions');

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas públicas (requerem apenas autenticação)
router.get('/', OrdemServicoController.index);
router.get('/statistics', async (req, res, next) => {
  try {
    const stats = await OrdemServicoController.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});
router.get('/relatorio/produtividade', OrdemServicoController.relatorioprodutividade);
router.get('/:id', OrdemServicoController.show);

// Rotas que requerem permissões específicas
router.post('/', 
  requireRole('tecnico'), 
  OrdemServicoController.create
);

router.put('/:id', 
  requireRole('tecnico'), 
  OrdemServicoController.update
);

router.patch('/:id/status', 
  requireRole('tecnico'), 
  OrdemServicoController.updateStatus
);

router.delete('/:id', 
  requireRole('supervisor'), 
  OrdemServicoController.destroy
);

module.exports = router;
