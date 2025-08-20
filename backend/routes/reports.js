const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const ReportController = require('../controllers/ReportController');
const AssetReportController = require('../controllers/AssetReportController');
const AnalyticsReportController = require('../controllers/AnalyticsReportController');
const ReportService = require('../services/ReportService');
const { authenticate } = require('../middleware/auth');
const { requireAnyRole } = require('../middleware/permissions');
const logger = require('../config/logger');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Middleware de autenticação para todas as rotas
router.use(authenticate);

/**
 * Rotas de relatórios do sistema
 * Todas as rotas requerem autenticação
 */

// Dashboard executivo
router.get('/dashboard-executivo', 
  requireAnyRole(['administrador', 'supervisor']),
  ReportController.dashboardExecutivo
);

// Relatórios de solicitações
router.get('/solicitacoes', 
  requireAnyRole(['administrador', 'supervisor', 'tecnico']),
  ReportController.relatorioSolicitacoes
);

// Performance por departamento
router.get('/performance-departamentos', 
  requireAnyRole(['administrador', 'supervisor']),
  ReportController.relatorioPerformanceDepartamentos
);

// Análise de SLA
router.get('/analise-sla', 
  requireAnyRole(['administrador', 'supervisor']),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = ReportController.getDateRange(req.query);
      
      const slaAnalysis = await sequelize.query(`
        SELECT 
          prioridade,
          COUNT(*) as total,
          COUNT(CASE 
            WHEN prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) <= 4 THEN 1
            WHEN prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) <= 24 THEN 1
            WHEN prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) <= 72 THEN 1
            WHEN prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) <= 168 THEN 1
          END) as dentro_sla,
          COUNT(CASE 
            WHEN prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) > 4 THEN 1
            WHEN prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) > 24 THEN 1
            WHEN prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) > 72 THEN 1
            WHEN prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) > 168 THEN 1
          END) as fora_sla,
          ROUND(COUNT(CASE 
            WHEN prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) <= 4 THEN 1
            WHEN prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) <= 24 THEN 1
            WHEN prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) <= 72 THEN 1
            WHEN prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, created_at, 
              CASE WHEN status = 'concluida' THEN updated_at ELSE NOW() END) <= 168 THEN 1
          END) * 100.0 / COUNT(*), 2) as percentual_sla
        FROM Solicitacoes 
        WHERE deletedAt IS NULL 
          AND created_at BETWEEN :startDate AND :endDate
        GROUP BY prioridade
        ORDER BY FIELD(prioridade, 'critica', 'alta', 'normal', 'baixa')
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: {
          titulo: `Análise de SLA - ${ReportService.formatPeriod(startDate, endDate)}`,
          periodo: ReportService.formatPeriod(startDate, endDate),
          slaAnalysis,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar análise de SLA:', error);
      next(error);
    }
  }
);

// Tendências e evolução
router.get('/tendencias', 
  requireAnyRole(['administrador', 'supervisor']),
  async (req, res, next) => {
    try {
      const { periodo = '12' } = req.query; // meses
      
      const tendencias = await sequelize.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as mes,
          COUNT(*) as total_solicitacoes,
          COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
          COUNT(CASE WHEN prioridade = 'critica' THEN 1 END) as criticas,
          AVG(CASE 
            WHEN status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, created_at, updated_at)
            ELSE NULL 
          END) as tempo_medio_resolucao
        FROM Solicitacoes 
        WHERE deletedAt IS NULL 
          AND created_at >= DATE_SUB(NOW(), INTERVAL :periodo MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY mes
      `, {
        replacements: { periodo: parseInt(periodo) },
        type: QueryTypes.SELECT
      });

      // Calcular crescimento mês a mês
      const tendenciasComGrowth = tendencias.map((item, index) => {
        if (index === 0) {
          return { ...item, crescimento: 0 };
        }
        
        const anterior = tendencias[index - 1];
        const crescimento = anterior.total_solicitacoes > 0 
          ? ((item.total_solicitacoes - anterior.total_solicitacoes) / anterior.total_solicitacoes * 100)
          : 0;
        
        return { ...item, crescimento: Math.round(crescimento * 100) / 100 };
      });

      res.json({
        success: true,
        data: {
          titulo: `Tendências - Últimos ${periodo} meses`,
          periodo: `Últimos ${periodo} meses`,
          tendencias: tendenciasComGrowth,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de tendências:', error);
      next(error);
    }
  }
);

// Produtividade de usuários
router.get('/produtividade-usuarios', 
  requireAnyRole(['administrador', 'supervisor']),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = ReportController.getDateRange(req.query);
      
      const produtividade = await sequelize.query(`
        SELECT 
          u.nome,
          u.email,
          u.perfil,
          COUNT(CASE WHEN s.solicitante_id = u.id THEN 1 END) as solicitacoes_criadas,
          COUNT(CASE WHEN s.responsavel_id = u.id THEN 1 END) as solicitacoes_atendidas,
          COUNT(CASE WHEN s.responsavel_id = u.id AND s.status = 'concluida' THEN 1 END) as solicitacoes_concluidas,
          ROUND(AVG(CASE 
            WHEN s.responsavel_id = u.id AND s.status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, s.created_at, s.updated_at)
            ELSE NULL 
          END), 2) as tempo_medio_resolucao,
          ROUND(COUNT(CASE WHEN s.responsavel_id = u.id AND s.status = 'concluida' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN s.responsavel_id = u.id THEN 1 END), 0), 2) as taxa_conclusao
        FROM Users u
        LEFT JOIN Solicitacoes s ON (u.id = s.solicitante_id OR u.id = s.responsavel_id)
          AND s.deletedAt IS NULL 
          AND s.created_at BETWEEN :startDate AND :endDate
        WHERE u.deletedAt IS NULL
        GROUP BY u.id, u.nome, u.email, u.perfil
        HAVING solicitacoes_criadas > 0 OR solicitacoes_atendidas > 0
        ORDER BY solicitacoes_atendidas DESC, solicitacoes_concluidas DESC
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: {
          titulo: `Produtividade de Usuários - ${ReportService.formatPeriod(startDate, endDate)}`,
          periodo: ReportService.formatPeriod(startDate, endDate),
          produtividade,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de produtividade:', error);
      next(error);
    }
  }
);

// === RELATÓRIOS DE ESTOQUE E ATIVOS ===

// Movimentação de estoque
router.get('/movimentacao-estoque', 
  requireAnyRole(['administrador', 'supervisor', 'tecnico']),
  AssetReportController.relatorioMovimentacaoEstoque
);

// Inventário atual
router.get('/inventario', 
  requireAnyRole(['administrador', 'supervisor', 'tecnico']),
  AssetReportController.relatorioInventario
);

// Controle de ativos
router.get('/ativos', 
  requireAnyRole(['administrador', 'supervisor']),
  AssetReportController.relatorioAtivos
);

// Itens com estoque baixo
router.get('/estoque-baixo', 
  requireAnyRole(['administrador', 'supervisor', 'tecnico']),
  async (req, res, next) => {
    try {
      const { categoria_id } = req.query;
      
      const whereConditions = ['ie.deletedAt IS NULL', 'ie.quantidade_atual <= ie.quantidade_minima'];
      const replacements = {};

      if (categoria_id) {
        whereConditions.push('ie.categoria_id = :categoria_id');
        replacements.categoria_id = categoria_id;
      }

      const whereClause = whereConditions.join(' AND ');

      const estoqueBaixo = await sequelize.query(`
        SELECT 
          ie.codigo,
          ie.nome,
          ie.quantidade_atual,
          ie.quantidade_minima,
          ie.quantidade_maxima,
          ie.valor_unitario,
          ie.unidade_medida,
          ie.localizacao,
          cat.nome as categoria,
          forn.nome as fornecedor,
          ie.ultima_movimentacao,
          DATEDIFF(NOW(), ie.ultima_movimentacao) as dias_sem_movimentacao,
          (ie.quantidade_minima - ie.quantidade_atual) as quantidade_a_comprar,
          (ie.quantidade_minima - ie.quantidade_atual) * ie.valor_unitario as valor_estimado_compra
        FROM ItemEstoques ie
        LEFT JOIN CategoriaEstoques cat ON ie.categoria_id = cat.id
        LEFT JOIN Fornecedors forn ON ie.fornecedor_id = forn.id
        WHERE ${whereClause}
        ORDER BY ie.quantidade_atual ASC, ie.nome
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: {
          titulo: 'Itens com Estoque Baixo',
          dataGeracao: new Date().toLocaleDateString('pt-BR'),
          filtros: { categoria_id },
          totalItens: estoqueBaixo.length,
          valorTotalCompraEstimado: estoqueBaixo.reduce((acc, item) => acc + (parseFloat(item.valor_estimado_compra) || 0), 0),
          estoqueBaixo,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de estoque baixo:', error);
      next(error);
    }
  }
);

// Ativos próximos da depreciação
router.get('/ativos-depreciacao', 
  requireAnyRole(['administrador', 'supervisor']),
  async (req, res, next) => {
    try {
      const proximosDepreciacao = await sequelize.query(`
        SELECT 
          a.codigo,
          a.nome,
          a.categoria,
          a.valor_aquisicao,
          a.data_aquisicao,
          a.vida_util_anos,
          s.nome as setor,
          a.responsavel_nome,
          YEAR(CURDATE()) - YEAR(a.data_aquisicao) as idade_anos,
          a.vida_util_anos - (YEAR(CURDATE()) - YEAR(a.data_aquisicao)) as anos_restantes,
          a.valor_aquisicao - (a.valor_aquisicao * (YEAR(CURDATE()) - YEAR(a.data_aquisicao)) / a.vida_util_anos) as valor_atual_estimado
        FROM Ativos a
        LEFT JOIN Setors s ON a.setor_id = s.id
        WHERE a.deletedAt IS NULL 
          AND a.status = 'ativo'
          AND (YEAR(CURDATE()) - YEAR(a.data_aquisicao)) >= (a.vida_util_anos * 0.8)
          AND (YEAR(CURDATE()) - YEAR(a.data_aquisicao)) < a.vida_util_anos
        ORDER BY anos_restantes ASC
      `, {
        type: QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: {
          titulo: 'Ativos Próximos da Depreciação',
          dataGeracao: new Date().toLocaleDateString('pt-BR'),
          totalAtivos: proximosDepreciacao.length,
          valorTotalAtual: proximosDepreciacao.reduce((acc, item) => acc + (parseFloat(item.valor_atual_estimado) || 0), 0),
          proximosDepreciacao,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de depreciação:', error);
      next(error);
    }
  }
);

// === RELATÓRIOS ANALÍTICOS E KPIS ===

// Dashboard de KPIs
router.get('/dashboard-kpis', 
  requireAnyRole(['administrador', 'supervisor']),
  AnalyticsReportController.dashboardKPIs
);

// Performance operacional
router.get('/performance-operacional', 
  requireAnyRole(['administrador', 'supervisor']),
  AnalyticsReportController.relatorioPerformanceOperacional
);

// Custos operacionais
router.get('/custos-operacionais', 
  requireAnyRole(['administrador', 'supervisor']),
  AnalyticsReportController.relatorioCustosOperacionais
);

// Análise de satisfação (simulada)
router.get('/satisfacao', 
  requireAnyRole(['administrador', 'supervisor']),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = ReportController.getDateRange(req.query);
      
      // Simular dados de satisfação baseados em performance
      const satisfacao = await sequelize.query(`
        SELECT 
          d.nome as departamento,
          COUNT(s.id) as total_solicitacoes,
          ROUND(AVG(CASE WHEN s.status = 'concluida' THEN 1 ELSE 0 END) * 100, 2) as taxa_conclusao,
          ROUND(AVG(CASE 
            WHEN s.status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, s.created_at, s.updated_at)
            ELSE NULL 
          END), 2) as tempo_medio_resolucao,
          -- Índice de satisfação simulado baseado em performance
          ROUND(
            (AVG(CASE WHEN s.status = 'concluida' THEN 1 ELSE 0 END) * 40) +
            (CASE 
              WHEN AVG(CASE 
                WHEN s.status = 'concluida' THEN 
                  TIMESTAMPDIFF(HOUR, s.created_at, s.updated_at)
                ELSE NULL 
              END) <= 24 THEN 30
              WHEN AVG(CASE 
                WHEN s.status = 'concluida' THEN 
                  TIMESTAMPDIFF(HOUR, s.created_at, s.updated_at)
                ELSE NULL 
              END) <= 72 THEN 20
              ELSE 10
            END) +
            (COUNT(CASE 
              WHEN s.prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 4 THEN 1
              WHEN s.prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 24 THEN 1
              WHEN s.prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 72 THEN 1
              WHEN s.prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 168 THEN 1
            END) * 30.0 / COUNT(s.id))
          , 2) as indice_satisfacao
        FROM Departments d
        LEFT JOIN Solicitacoes s ON d.id = s.department_id 
          AND s.deletedAt IS NULL 
          AND s.created_at BETWEEN :startDate AND :endDate
        WHERE d.deletedAt IS NULL
        GROUP BY d.id, d.nome
        HAVING total_solicitacoes > 0
        ORDER BY indice_satisfacao DESC
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: {
          titulo: `Análise de Satisfação - ${ReportService.formatPeriod(startDate, endDate)}`,
          periodo: ReportService.formatPeriod(startDate, endDate),
          satisfacao,
          resumo: {
            satisfacaoMedia: satisfacao.reduce((acc, item) => acc + item.indice_satisfacao, 0) / satisfacao.length,
            melhorDepartamento: satisfacao[0]?.departamento,
            piorDepartamento: satisfacao[satisfacao.length - 1]?.departamento
          },
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar análise de satisfação:', error);
      next(error);
    }
  }
);

// Comparativo de períodos
router.get('/comparativo-periodos', 
  requireAnyRole(['administrador', 'supervisor']),
  async (req, res, next) => {
    try {
      const { 
        periodo1_start, periodo1_end,
        periodo2_start, periodo2_end,
        formato = 'json'
      } = req.query;

      if (!periodo1_start || !periodo1_end || !periodo2_start || !periodo2_end) {
        return res.status(400).json({
          success: false,
          message: 'É necessário especificar os dois períodos para comparação'
        });
      }

      // Dados do período 1
      const periodo1 = await AnalyticsReportController.calculateKPIs(periodo1_start, periodo1_end);
      // Dados do período 2
      const periodo2 = await AnalyticsReportController.calculateKPIs(periodo2_start, periodo2_end);

      // Calcular variações
      const variacoes = AnalyticsReportController.calculateVariations(periodo1, periodo2);

      res.json({
        success: true,
        data: {
          titulo: 'Comparativo de Períodos',
          periodo1: {
            nome: ReportService.formatPeriod(periodo1_start, periodo1_end),
            dados: periodo1
          },
          periodo2: {
            nome: ReportService.formatPeriod(periodo2_start, periodo2_end),
            dados: periodo2
          },
          variacoes,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar comparativo de períodos:', error);
      next(error);
    }
  }
);

module.exports = router;
