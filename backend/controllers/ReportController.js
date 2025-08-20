const { QueryTypes } = require('sequelize');
const { sequelize, Solicitacao, User, Department, Category, SubCategory, Ativo, ItemEstoque, MovimentacaoEstoque, OrdemServico } = require('../models');
const ReportService = require('../services/ReportService');
const logger = require('../config/logger');
const { QueryOptimizer } = require('../utils/QueryOptimizer');
const { logBusinessOperation } = require('../middleware/performance');

/**
 * Controller base para todos os relatórios do sistema
 * Gerencia geração, exportação e visualização de relatórios
 */
class ReportController {

  /**
   * Dashboard executivo - visão geral do sistema
   */
  async dashboardExecutivo(req, res, next) {
    try {
      const { startDate, endDate } = this.getDateRange(req.query);
      
      // Solicita por status
      const solicitacoesPorStatus = await sequelize.query(`
        SELECT 
          status,
          COUNT(*) as total,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Solicitacoes WHERE deletedAt IS NULL AND created_at BETWEEN :startDate AND :endDate), 2) as percentual
        FROM Solicitacoes 
        WHERE deletedAt IS NULL 
          AND created_at BETWEEN :startDate AND :endDate
        GROUP BY status
        ORDER BY total DESC
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Solicitações por categoria
      const solicitacoesPorCategoria = await sequelize.query(`
        SELECT 
          categoria,
          COUNT(*) as total,
          AVG(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) * 100 as taxa_conclusao
        FROM Solicitacoes 
        WHERE deletedAt IS NULL 
          AND created_at BETWEEN :startDate AND :endDate
        GROUP BY categoria
        ORDER BY total DESC
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Solicitações por prioridade
      const solicitacoesPorPrioridade = await sequelize.query(`
        SELECT 
          prioridade,
          COUNT(*) as total,
          AVG(CASE 
            WHEN status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, created_at, updated_at)
            ELSE NULL 
          END) as tempo_medio_resolucao
        FROM Solicitacoes 
        WHERE deletedAt IS NULL 
          AND created_at BETWEEN :startDate AND :endDate
        GROUP BY prioridade
        ORDER BY FIELD(prioridade, 'critica', 'alta', 'normal', 'baixa')
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Performance por departamento
      const performanceDepartamentos = await sequelize.query(`
        SELECT 
          d.nome as departamento,
          COUNT(s.id) as total_solicitacoes,
          AVG(CASE WHEN s.status = 'concluida' THEN 1 ELSE 0 END) * 100 as taxa_conclusao,
          AVG(CASE 
            WHEN s.status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, s.created_at, s.updated_at)
            ELSE NULL 
          END) as tempo_medio_resolucao
        FROM Departments d
        LEFT JOIN Solicitacoes s ON d.id = s.department_id 
          AND s.deletedAt IS NULL 
          AND s.created_at BETWEEN :startDate AND :endDate
        WHERE d.deletedAt IS NULL
        GROUP BY d.id, d.nome
        HAVING total_solicitacoes > 0
        ORDER BY total_solicitacoes DESC
        LIMIT 10
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Métricas principais
      const metricas = await sequelize.query(`
        SELECT 
          COUNT(*) as total_solicitacoes,
          COUNT(CASE WHEN status = 'aberta' THEN 1 END) as abertas,
          COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
          COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
          COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as canceladas,
          AVG(CASE 
            WHEN status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, created_at, updated_at)
            ELSE NULL 
          END) as tempo_medio_resolucao,
          COUNT(CASE WHEN prioridade = 'critica' AND status != 'concluida' THEN 1 END) as criticas_pendentes
        FROM Solicitacoes 
        WHERE deletedAt IS NULL 
          AND created_at BETWEEN :startDate AND :endDate
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Tendência mensal
      const tendenciaMensal = await sequelize.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as mes,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas
        FROM Solicitacoes 
        WHERE deletedAt IS NULL 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY mes
      `, {
        type: QueryTypes.SELECT
      });

      // Top usuários solicitantes
      const topSolicitantes = await sequelize.query(`
        SELECT 
          u.nome,
          u.email,
          COUNT(s.id) as total_solicitacoes,
          AVG(CASE WHEN s.status = 'concluida' THEN 1 ELSE 0 END) * 100 as taxa_conclusao
        FROM Users u
        INNER JOIN Solicitacoes s ON u.id = s.solicitante_id
        WHERE u.deletedAt IS NULL 
          AND s.deletedAt IS NULL 
          AND s.created_at BETWEEN :startDate AND :endDate
        GROUP BY u.id, u.nome, u.email
        ORDER BY total_solicitacoes DESC
        LIMIT 10
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      const dashboard = {
        periodo: ReportService.formatPeriod(startDate, endDate),
        metricas: metricas[0],
        solicitacoesPorStatus,
        solicitacoesPorCategoria,
        solicitacoesPorPrioridade,
        performanceDepartamentos,
        tendenciaMensal,
        topSolicitantes,
        geradoEm: new Date().toISOString()
      };

      // Log da operação
      logBusinessOperation(
        'dashboard_executivo_gerado',
        req.user.id,
        { periodo: ReportService.formatPeriod(startDate, endDate) }
      );

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      logger.error('Erro ao gerar dashboard executivo:', error);
      next(error);
    }
  }

  /**
   * Relatório detalhado de solicitações
   */
  async relatorioSolicitacoes(req, res, next) {
    try {
      const { 
        startDate, 
        endDate, 
        status, 
        categoria, 
        prioridade, 
        department_id,
        formato = 'json'
      } = this.getFilters(req.query);

      // Construir filtros
      const whereConditions = ['s.deletedAt IS NULL'];
      const replacements = { startDate, endDate };

      if (startDate && endDate) {
        whereConditions.push('s.created_at BETWEEN :startDate AND :endDate');
      }

      if (status) {
        whereConditions.push('s.status = :status');
        replacements.status = status;
      }

      if (categoria) {
        whereConditions.push('s.categoria = :categoria');
        replacements.categoria = categoria;
      }

      if (prioridade) {
        whereConditions.push('s.prioridade = :prioridade');
        replacements.prioridade = prioridade;
      }

      if (department_id) {
        whereConditions.push('s.department_id = :department_id');
        replacements.department_id = department_id;
      }

      const whereClause = whereConditions.join(' AND ');

      const solicitacoes = await sequelize.query(`
        SELECT 
          s.numero,
          s.titulo,
          s.categoria,
          s.subcategoria,
          s.prioridade,
          s.status,
          s.localizacao,
          s.created_at as data_abertura,
          s.updated_at as data_atualizacao,
          solicitante.nome as solicitante_nome,
          solicitante.email as solicitante_email,
          responsavel.nome as responsavel_nome,
          dept.nome as departamento,
          CASE 
            WHEN s.status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, s.created_at, s.updated_at)
            ELSE 
              TIMESTAMPDIFF(HOUR, s.created_at, NOW())
          END as tempo_decorrido_horas,
          CASE 
            WHEN s.prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 4 THEN 'SIM'
            WHEN s.prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 24 THEN 'SIM'
            WHEN s.prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 72 THEN 'SIM'
            WHEN s.prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 168 THEN 'SIM'
            ELSE 'NÃO'
          END as fora_sla
        FROM Solicitacoes s
        LEFT JOIN Users solicitante ON s.solicitante_id = solicitante.id
        LEFT JOIN Users responsavel ON s.responsavel_id = responsavel.id
        LEFT JOIN Departments dept ON s.department_id = dept.id
        WHERE ${whereClause}
        ORDER BY s.created_at DESC
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      const titulo = `Relatório de Solicitações - ${ReportService.formatPeriod(startDate, endDate)}`;

      if (formato === 'excel') {
        const headers = [
          { key: 'numero', label: 'Número', type: 'text' },
          { key: 'titulo', label: 'Título', type: 'text' },
          { key: 'categoria', label: 'Categoria', type: 'text' },
          { key: 'subcategoria', label: 'Subcategoria', type: 'text' },
          { key: 'prioridade', label: 'Prioridade', type: 'text' },
          { key: 'status', label: 'Status', type: 'text' },
          { key: 'localizacao', label: 'Localização', type: 'text' },
          { key: 'data_abertura', label: 'Data Abertura', type: 'datetime' },
          { key: 'solicitante_nome', label: 'Solicitante', type: 'text' },
          { key: 'responsavel_nome', label: 'Responsável', type: 'text' },
          { key: 'departamento', label: 'Departamento', type: 'text' },
          { key: 'tempo_decorrido_horas', label: 'Tempo (horas)', type: 'number' },
          { key: 'fora_sla', label: 'Fora do SLA', type: 'text' }
        ];

        const excel = await ReportService.generateExcel(solicitacoes, {
          title: titulo,
          headers,
          fileName: `solicitacoes_${Date.now()}.xlsx`
        });

        res.set({
          'Content-Type': excel.contentType,
          'Content-Disposition': `attachment; filename="${excel.fileName}"`
        });

        return res.send(excel.buffer);
      }

      if (formato === 'pdf') {
        const headers = [
          { key: 'numero', label: 'Número', type: 'text' },
          { key: 'titulo', label: 'Título', type: 'text' },
          { key: 'categoria', label: 'Categoria', type: 'text' },
          { key: 'prioridade', label: 'Prioridade', type: 'text' },
          { key: 'status', label: 'Status', type: 'text' },
          { key: 'data_abertura', label: 'Data', type: 'date' },
          { key: 'solicitante_nome', label: 'Solicitante', type: 'text' },
          { key: 'fora_sla', label: 'Fora SLA', type: 'text' }
        ];

        const pdf = await ReportService.generatePDF(solicitacoes, {
          title: titulo,
          headers,
          fileName: `solicitacoes_${Date.now()}.pdf`,
          orientation: 'landscape'
        });

        res.set({
          'Content-Type': pdf.contentType,
          'Content-Disposition': `attachment; filename="${pdf.fileName}"`
        });

        return res.send(pdf.buffer);
      }

      // Estatísticas do relatório
      const estatisticas = {
        total: solicitacoes.length,
        porStatus: {},
        porPrioridade: {},
        foraSLA: solicitacoes.filter(s => s.fora_sla === 'SIM').length,
        tempoMedioResolucao: ReportService.calculateStats(
          solicitacoes.filter(s => s.status === 'concluida'),
          'tempo_decorrido_horas'
        ).avg
      };

      // Agrupar por status
      solicitacoes.forEach(s => {
        estatisticas.porStatus[s.status] = (estatisticas.porStatus[s.status] || 0) + 1;
        estatisticas.porPrioridade[s.prioridade] = (estatisticas.porPrioridade[s.prioridade] || 0) + 1;
      });

      logBusinessOperation(
        'relatorio_solicitacoes_gerado',
        req.user.id,
        { 
          periodo: ReportService.formatPeriod(startDate, endDate),
          total: solicitacoes.length,
          formato
        }
      );

      res.json({
        success: true,
        data: {
          titulo,
          periodo: ReportService.formatPeriod(startDate, endDate),
          filtros: { status, categoria, prioridade, department_id },
          estatisticas,
          solicitacoes,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de solicitações:', error);
      next(error);
    }
  }

  /**
   * Análise de performance por departamento
   */
  async relatorioPerformanceDepartamentos(req, res, next) {
    try {
      const { startDate, endDate, formato = 'json' } = this.getFilters(req.query);

      const performance = await sequelize.query(`
        SELECT 
          d.nome as departamento,
          COUNT(s.id) as total_solicitacoes,
          COUNT(CASE WHEN s.status = 'aberta' THEN 1 END) as abertas,
          COUNT(CASE WHEN s.status = 'em_andamento' THEN 1 END) as em_andamento,
          COUNT(CASE WHEN s.status = 'concluida' THEN 1 END) as concluidas,
          COUNT(CASE WHEN s.status = 'cancelada' THEN 1 END) as canceladas,
          ROUND(AVG(CASE WHEN s.status = 'concluida' THEN 1 ELSE 0 END) * 100, 2) as taxa_conclusao,
          ROUND(AVG(CASE 
            WHEN s.status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, s.created_at, s.updated_at)
            ELSE NULL 
          END), 2) as tempo_medio_resolucao,
          COUNT(CASE 
            WHEN s.prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 4 THEN 1
            WHEN s.prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 24 THEN 1
            WHEN s.prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 72 THEN 1
            WHEN s.prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 168 THEN 1
          END) as fora_sla,
          ROUND(COUNT(CASE 
            WHEN s.prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 4 THEN 1
            WHEN s.prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 24 THEN 1
            WHEN s.prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 72 THEN 1
            WHEN s.prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, s.created_at, NOW()) > 168 THEN 1
          END) * 100.0 / COUNT(s.id), 2) as percentual_fora_sla
        FROM Departments d
        LEFT JOIN Solicitacoes s ON d.id = s.department_id 
          AND s.deletedAt IS NULL 
          AND s.created_at BETWEEN :startDate AND :endDate
        WHERE d.deletedAt IS NULL
        GROUP BY d.id, d.nome
        HAVING total_solicitacoes > 0
        ORDER BY total_solicitacoes DESC
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      const titulo = `Performance por Departamento - ${ReportService.formatPeriod(startDate, endDate)}`;

      if (formato === 'excel') {
        const headers = [
          { key: 'departamento', label: 'Departamento', type: 'text' },
          { key: 'total_solicitacoes', label: 'Total', type: 'number', total: 'sum' },
          { key: 'abertas', label: 'Abertas', type: 'number', total: 'sum' },
          { key: 'em_andamento', label: 'Em Andamento', type: 'number', total: 'sum' },
          { key: 'concluidas', label: 'Concluídas', type: 'number', total: 'sum' },
          { key: 'canceladas', label: 'Canceladas', type: 'number', total: 'sum' },
          { key: 'taxa_conclusao', label: 'Taxa Conclusão (%)', type: 'percentage' },
          { key: 'tempo_medio_resolucao', label: 'Tempo Médio (h)', type: 'number' },
          { key: 'fora_sla', label: 'Fora SLA', type: 'number', total: 'sum' },
          { key: 'percentual_fora_sla', label: 'Fora SLA (%)', type: 'percentage' }
        ];

        const excel = await ReportService.generateExcel(performance, {
          title: titulo,
          headers,
          fileName: `performance_departamentos_${Date.now()}.xlsx`,
          totals: true
        });

        res.set({
          'Content-Type': excel.contentType,
          'Content-Disposition': `attachment; filename="${excel.fileName}"`
        });

        return res.send(excel.buffer);
      }

      logBusinessOperation(
        'relatorio_performance_departamentos_gerado',
        req.user.id,
        { 
          periodo: ReportService.formatPeriod(startDate, endDate),
          departamentos: performance.length,
          formato
        }
      );

      res.json({
        success: true,
        data: {
          titulo,
          periodo: ReportService.formatPeriod(startDate, endDate),
          performance,
          resumo: {
            totalDepartamentos: performance.length,
            melhorTaxaConclusao: Math.max(...performance.map(p => p.taxa_conclusao || 0)),
            piorTaxaConclusao: Math.min(...performance.map(p => p.taxa_conclusao || 0)),
            tempoMedioGeral: performance.reduce((acc, p) => acc + (p.tempo_medio_resolucao || 0), 0) / performance.length
          },
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de performance de departamentos:', error);
      next(error);
    }
  }

  /**
   * Helper: Obter range de datas
   */
  getDateRange(query) {
    const { startDate, endDate } = query;
    
    // Se não especificado, usar últimos 30 dias
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Ajustar para incluir o dia inteiro
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }

  /**
   * Helper: Obter filtros da query
   */
  getFilters(query) {
    const { startDate, endDate } = this.getDateRange(query);
    
    return {
      startDate,
      endDate,
      status: query.status || null,
      categoria: query.categoria || null,
      prioridade: query.prioridade || null,
      department_id: query.department_id || null,
      formato: query.formato || 'json'
    };
  }
}

module.exports = new ReportController();