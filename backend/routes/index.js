const express = require('express');
const router = express.Router();

// Importar rotas
const authRoutes = require('./auth');
const userRoutes = require('./users');
const permissionRoutes = require('./permissions');
const solicitacaoRoutes = require('./solicitacoes');
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
router.use('/solicitacoes', solicitacaoRoutes);
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

module.exports = router;