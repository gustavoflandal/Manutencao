const express = require('express');
const router = express.Router();

// Importar rotas
const authRoutes = require('./auth');
const userRoutes = require('./users');
const permissionRoutes = require('./permissions');
const departmentRoutes = require('./departments');
const solicitacaoRoutes = require('./solicitacoes');
const categoryRoutes = require('./categories');
const subcategoryRoutes = require('./subcategories');
const ordemServicoRoutes = require('./ordens-servico');
const ativoRoutes = require('./ativos');
const estoqueRoutes = require('./estoque');
const preventivaRoutes = require('./preventiva');
const relatorioRoutes = require('./relatorios');
const uploadRoutes = require('./upload');

// Registrar rotas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/permissions', permissionRoutes);
router.use('/departments', departmentRoutes);
router.use('/solicitacoes', solicitacaoRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/ordens-servico', ordemServicoRoutes);
router.use('/ativos', ativoRoutes);
router.use('/estoque', estoqueRoutes);
router.use('/preventiva', preventivaRoutes);
router.use('/relatorios', relatorioRoutes);
router.use('/upload', uploadRoutes);

// Rota de health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rota pública para departamentos ativos (para formulários)
router.get('/public/departments/active', async (req, res) => {
  try {
    const { Department } = require('../models');
    const departments = await Department.findAll({
      where: { ativo: true },
      attributes: ['id', 'nome'],
      order: [['nome', 'ASC']]
    });
    
    res.json({
      success: true,
      data: { departments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;