const express = require('express');
const router = express.Router();
const AuditoriaController = require('../controllers/AuditoriaController');
const { authenticate } = require('../middleware/auth');
const AuditoriaMiddleware = require('../middleware/AuditoriaMiddleware');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

/**
 * @route   GET /api/auditoria/logs
 * @desc    Listar logs de auditoria com filtros
 * @access  Private (Admin)
 */
router.get('/logs', AuditoriaController.index);

/**
 * @route   GET /api/auditoria/logs/:id
 * @desc    Buscar log específico por ID
 * @access  Private (Admin)
 */
router.get('/logs/:id', AuditoriaController.show);

/**
 * @route   GET /api/auditoria/estatisticas
 * @desc    Obter estatísticas de auditoria
 * @access  Private (Admin)
 */
router.get('/estatisticas', AuditoriaController.estatisticas);

/**
 * @route   GET /api/auditoria/relatorio
 * @desc    Gerar relatório de auditoria
 * @access  Private (Admin)
 */
router.get('/relatorio', 
  AuditoriaMiddleware.operacaoCritica('Geração de relatório de auditoria'),
  AuditoriaController.relatorio
);

/**
 * @route   GET /api/auditoria/usuario/:usuarioId
 * @desc    Buscar logs por usuário específico
 * @access  Private (Admin)
 */
router.get('/usuario/:usuarioId', AuditoriaController.logsPorUsuario);

/**
 * @route   GET /api/auditoria/modulo/:modulo
 * @desc    Buscar logs por módulo específico
 * @access  Private (Admin)
 */
router.get('/modulo/:modulo', AuditoriaController.logsPorModulo);

/**
 * @route   GET /api/auditoria/criticas
 * @desc    Buscar operações críticas
 * @access  Private (Admin)
 */
router.get('/criticas', AuditoriaController.operacoesCriticas);

/**
 * @route   GET /api/auditoria/periodo
 * @desc    Buscar logs por período
 * @access  Private (Admin)
 */
router.get('/periodo', AuditoriaController.logsPorPeriodo);

module.exports = router;