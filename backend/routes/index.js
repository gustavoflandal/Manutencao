const express = require('express');
const router = express.Router();

// Importar rotas
const authRoutes = require('./auth');
const fmeaRoutes = require('./fmea');
const ordensRoutes = require('./ordens-servico');
const usersRoutes = require('./users');
const ativosRoutes = require('./ativos');
const solicitacoesRoutes = require('./solicitacoes');
const setoresRoutes = require('./setores');
const categoriesRoutes = require('./categories');
const subcategoriesRoutes = require('./subcategories');
const departmentsRoutes = require('./departments');
const permissionsRoutes = require('./permissions');
const estoqueRoutes = require('./estoque');
const agendamentoRoutes = require('./agendamento');
const preventivaRoutes = require('./preventiva');
const relatoriosRoutes = require('./relatorios');
const reportsRoutes = require('./reports');
const uploadRoutes = require('./upload');
const workflowsRoutes = require('./workflows');
const auditoriaRoutes = require('./auditoria');
const notificacoesRoutes = require('./notificacoes');
const analyticsRoutes = require('./analytics');
const publicRoutes = require('./public');

// Configurar rotas públicas (sem autenticação)
router.use('/public', publicRoutes);

// Configurar rotas autenticadas
router.use('/auth', authRoutes);
router.use('/fmea', fmeaRoutes);
router.use('/ordens-servico', ordensRoutes);
router.use('/users', usersRoutes);
router.use('/ativos', ativosRoutes);
router.use('/solicitacoes', solicitacoesRoutes);
router.use('/setores', setoresRoutes);
router.use('/categories', categoriesRoutes);
router.use('/subcategories', subcategoriesRoutes);
router.use('/departments', departmentsRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/estoque', estoqueRoutes);
router.use('/agendamento', agendamentoRoutes);
router.use('/preventiva', preventivaRoutes);
router.use('/relatorios', relatoriosRoutes);
router.use('/reports', reportsRoutes);
router.use('/upload', uploadRoutes);
router.use('/workflows', workflowsRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/notificacoes', notificacoesRoutes);
router.use('/analytics', analyticsRoutes);

// Rota de health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;