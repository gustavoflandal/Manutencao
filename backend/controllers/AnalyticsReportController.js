const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const ReportService = require('../services/ReportService');
const logger = require('../config/logger');
const { logBusinessOperation } = require('../middleware/performance');

/**
 * Controller para relatórios analíticos e KPIs
 */
class AnalyticsReportController {

  /**
   * Dashboard de KPIs principais
   */
  async dashboardKPIs(req, res, next) {
    try {
      const { startDate, endDate } = this.getDateRange(req.query);
      const { compareWith = 'previous-period' } = req.query;

      // Período atual
      const kpisAtual = await this.calculateKPIs(startDate, endDate);

      // Período de comparação
      let kpisComparacao = null;
      let periodoComparacao = '';

      if (compareWith === 'previous-period') {
        const diffMs = new Date(endDate) - new Date(startDate);
        const startComparacao = new Date(new Date(startDate) - diffMs);
        const endComparacao = new Date(startDate);
        
        kpisComparacao = await this.calculateKPIs(
          startComparacao.toISOString(),
          endComparacao.toISOString()
        );
        periodoComparacao = ReportService.formatPeriod(startComparacao.toISOString(), endComparacao.toISOString());
      } else if (compareWith === 'previous-year') {
        const startComparacao = new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() - 1));
        const endComparacao = new Date(new Date(endDate).setFullYear(new Date(endDate).getFullYear() - 1));
        
        kpisComparacao = await this.calculateKPIs(
          startComparacao.toISOString(),
          endComparacao.toISOString()
        );
        periodoComparacao = ReportService.formatPeriod(startComparacao.toISOString(), endComparacao.toISOString());
      }

      // Calcular variações percentuais
      const variacoes = kpisComparacao ? this.calculateVariations(kpisAtual, kpisComparacao) : {};

      // Gráficos para dashboard
      const graficos = await this.generateDashboardCharts(startDate, endDate);

      logBusinessOperation(
        'dashboard_kpis_gerado',
        req.user.id,
        { 
          periodo: ReportService.formatPeriod(startDate, endDate),
          compareWith
        }
      );

      res.json({
        success: true,
        data: {
          titulo: 'Dashboard de KPIs',
          periodo: ReportService.formatPeriod(startDate, endDate),
          periodoComparacao,
          kpisAtual,
          kpisComparacao,
          variacoes,
          graficos,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar dashboard de KPIs:', error);
      next(error);
    }
  }

  /**
   * Relatório de performance operacional
   */
  async relatorioPerformanceOperacional(req, res, next) {
    try {
      const { startDate, endDate, formato = 'json' } = this.getFilters(req.query);

      // Métricas operacionais principais
      const metricas = await sequelize.query(`
        SELECT 
          'Solicitações' as categoria,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
          COUNT(CASE WHEN status = 'aberta' THEN 1 END) as abertas,
          COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
          ROUND(AVG(CASE 
            WHEN status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, created_at, updated_at)
            ELSE NULL 
          END), 2) as tempo_medio_resolucao,
          ROUND(COUNT(CASE WHEN status = 'concluida' THEN 1 END) * 100.0 / COUNT(*), 2) as taxa_conclusao
        FROM Solicitacoes 
        WHERE deletedAt IS NULL 
          AND created_at BETWEEN :startDate AND :endDate
        
        UNION ALL
        
        SELECT 
          'Ordens de Serviço' as categoria,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
          COUNT(CASE WHEN status = 'aberta' THEN 1 END) as abertas,
          COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
          ROUND(AVG(CASE 
            WHEN status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, created_at, updated_at)
            ELSE NULL 
          END), 2) as tempo_medio_resolucao,
          ROUND(COUNT(CASE WHEN status = 'concluida' THEN 1 END) * 100.0 / COUNT(*), 2) as taxa_conclusao
        FROM OrdemServicos 
        WHERE deletedAt IS NULL 
          AND created_at BETWEEN :startDate AND :endDate
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Performance por categoria/tipo
      const performanceCategorias = await sequelize.query(`
        SELECT 
          categoria as nome,
          COUNT(*) as total_solicitacoes,
          ROUND(AVG(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) * 100, 2) as taxa_conclusao,
          ROUND(AVG(CASE 
            WHEN status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, created_at, updated_at)
            ELSE NULL 
          END), 2) as tempo_medio_resolucao,
          COUNT(CASE WHEN prioridade = 'critica' THEN 1 END) as criticas,
          COUNT(CASE 
            WHEN prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) > 4 THEN 1
            WHEN prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) > 24 THEN 1
            WHEN prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) > 72 THEN 1
            WHEN prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) > 168 THEN 1
          END) as fora_sla
        FROM Solicitacoes
        WHERE deletedAt IS NULL 
          AND created_at BETWEEN :startDate AND :endDate
        GROUP BY categoria
        ORDER BY total_solicitacoes DESC
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Eficiência por usuário (top 10)
      const eficienciaUsuarios = await sequelize.query(`
        SELECT 
          u.nome,
          u.perfil,
          COUNT(s.id) as total_atendidas,
          COUNT(CASE WHEN s.status = 'concluida' THEN 1 END) as concluidas,
          ROUND(COUNT(CASE WHEN s.status = 'concluida' THEN 1 END) * 100.0 / COUNT(s.id), 2) as taxa_conclusao,
          ROUND(AVG(CASE 
            WHEN s.status = 'concluida' THEN 
              TIMESTAMPDIFF(HOUR, s.created_at, s.updated_at)
            ELSE NULL 
          END), 2) as tempo_medio_resolucao,
          COUNT(CASE 
            WHEN s.prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 4 THEN 1
            WHEN s.prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 24 THEN 1
            WHEN s.prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 72 THEN 1
            WHEN s.prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 168 THEN 1
          END) as dentro_sla,
          ROUND(COUNT(CASE 
            WHEN s.prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 4 THEN 1
            WHEN s.prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 24 THEN 1
            WHEN s.prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 72 THEN 1
            WHEN s.prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, s.created_at, IFNULL(s.updated_at, NOW())) <= 168 THEN 1
          END) * 100.0 / COUNT(s.id), 2) as taxa_sla
        FROM Users u
        INNER JOIN Solicitacoes s ON u.id = s.responsavel_id
        WHERE u.deletedAt IS NULL 
          AND s.deletedAt IS NULL 
          AND s.created_at BETWEEN :startDate AND :endDate
        GROUP BY u.id, u.nome, u.perfil
        HAVING total_atendidas >= 5
        ORDER BY taxa_conclusao DESC, taxa_sla DESC
        LIMIT 10
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Tendência de volume
      const tendenciaVolume = await sequelize.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as data,
          COUNT(*) as total_solicitacoes,
          COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
          COUNT(CASE WHEN prioridade = 'critica' THEN 1 END) as criticas
        FROM Solicitacoes
        WHERE deletedAt IS NULL 
          AND created_at BETWEEN :startDate AND :endDate
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY data
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      const titulo = `Performance Operacional - ${ReportService.formatPeriod(startDate, endDate)}`;

      if (formato === 'excel') {
        // Criar planilha com múltiplas abas
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        // Aba 1: Métricas Gerais
        const wsMetricas = workbook.addWorksheet('Métricas Gerais');
        wsMetricas.columns = [
          { header: 'Categoria', key: 'categoria', width: 20 },
          { header: 'Total', key: 'total', width: 15 },
          { header: 'Concluídas', key: 'concluidas', width: 15 },
          { header: 'Abertas', key: 'abertas', width: 15 },
          { header: 'Em Andamento', key: 'em_andamento', width: 15 },
          { header: 'Taxa Conclusão (%)', key: 'taxa_conclusao', width: 20 },
          { header: 'Tempo Médio (h)', key: 'tempo_medio_resolucao', width: 20 }
        ];
        wsMetricas.addRows(metricas);

        // Aba 2: Performance por Categoria
        const wsCategorias = workbook.addWorksheet('Performance Categorias');
        wsCategorias.columns = [
          { header: 'Categoria', key: 'nome', width: 20 },
          { header: 'Total', key: 'total_solicitacoes', width: 15 },
          { header: 'Taxa Conclusão (%)', key: 'taxa_conclusao', width: 20 },
          { header: 'Tempo Médio (h)', key: 'tempo_medio_resolucao', width: 20 },
          { header: 'Críticas', key: 'criticas', width: 15 },
          { header: 'Fora SLA', key: 'fora_sla', width: 15 }
        ];
        wsCategorias.addRows(performanceCategorias);

        // Aba 3: Eficiência de Usuários
        const wsUsuarios = workbook.addWorksheet('Eficiência Usuários');
        wsUsuarios.columns = [
          { header: 'Nome', key: 'nome', width: 25 },
          { header: 'Perfil', key: 'perfil', width: 15 },
          { header: 'Total Atendidas', key: 'total_atendidas', width: 15 },
          { header: 'Concluídas', key: 'concluidas', width: 15 },
          { header: 'Taxa Conclusão (%)', key: 'taxa_conclusao', width: 20 },
          { header: 'Tempo Médio (h)', key: 'tempo_medio_resolucao', width: 20 },
          { header: 'Taxa SLA (%)', key: 'taxa_sla', width: 15 }
        ];
        wsUsuarios.addRows(eficienciaUsuarios);

        const buffer = await workbook.xlsx.writeBuffer();

        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="performance_operacional_${Date.now()}.xlsx"`
        });

        return res.send(buffer);
      }

      logBusinessOperation(
        'relatorio_performance_operacional_gerado',
        req.user.id,
        { 
          periodo: ReportService.formatPeriod(startDate, endDate),
          formato
        }
      );

      res.json({
        success: true,
        data: {
          titulo,
          periodo: ReportService.formatPeriod(startDate, endDate),
          metricas,
          performanceCategorias,
          eficienciaUsuarios,
          tendenciaVolume,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de performance operacional:', error);
      next(error);
    }
  }

  /**
   * Análise de custos operacionais
   */
  async relatorioCustosOperacionais(req, res, next) {
    try {
      const { startDate, endDate, formato = 'json' } = this.getFilters(req.query);

      // Custos de movimentação de estoque
      const custosEstoque = await sequelize.query(`
        SELECT 
          cat.nome as categoria,
          COUNT(me.id) as total_movimentacoes,
          SUM(CASE WHEN me.tipo_movimentacao = 'entrada' THEN me.valor_total ELSE 0 END) as total_entradas,
          SUM(CASE WHEN me.tipo_movimentacao = 'saida' THEN me.valor_total ELSE 0 END) as total_saidas,
          SUM(me.valor_total) as valor_total_movimentado,
          AVG(me.valor_unitario) as valor_medio_unitario
        FROM MovimentacaoEstoques me
        INNER JOIN ItemEstoques ie ON me.item_id = ie.id
        LEFT JOIN CategoriaEstoques cat ON ie.categoria_id = cat.id
        WHERE me.deletedAt IS NULL 
          AND me.created_at BETWEEN :startDate AND :endDate
        GROUP BY cat.id, cat.nome
        ORDER BY valor_total_movimentado DESC
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Análise de ROI por departamento
      const roiDepartamentos = await sequelize.query(`
        SELECT 
          d.nome as departamento,
          COUNT(s.id) as total_solicitacoes,
          COUNT(CASE WHEN s.status = 'concluida' THEN 1 END) as solicitacoes_concluidas,
          COALESCE(SUM(me.valor_total), 0) as custos_materiais,
          ROUND(COUNT(CASE WHEN s.status = 'concluida' THEN 1 END) / NULLIF(COUNT(s.id), 0) * 100, 2) as eficiencia_resolucao,
          ROUND(COALESCE(SUM(me.valor_total), 0) / NULLIF(COUNT(s.id), 0), 2) as custo_medio_por_solicitacao
        FROM Departments d
        LEFT JOIN Solicitacoes s ON d.id = s.department_id 
          AND s.deletedAt IS NULL 
          AND s.created_at BETWEEN :startDate AND :endDate
        LEFT JOIN OrdemServicos os ON s.id = os.solicitacao_id
        LEFT JOIN MovimentacaoEstoques me ON os.id = me.ordem_servico_id
          AND me.deletedAt IS NULL
        WHERE d.deletedAt IS NULL
        GROUP BY d.id, d.nome
        HAVING total_solicitacoes > 0
        ORDER BY custo_medio_por_solicitacao DESC
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Tendência de custos mensais
      const tendenciaCustos = await sequelize.query(`
        SELECT 
          DATE_FORMAT(me.created_at, '%Y-%m') as mes,
          SUM(CASE WHEN me.tipo_movimentacao = 'entrada' THEN me.valor_total ELSE 0 END) as entradas,
          SUM(CASE WHEN me.tipo_movimentacao = 'saida' THEN me.valor_total ELSE 0 END) as saidas,
          SUM(me.valor_total) as total,
          COUNT(DISTINCT s.id) as solicitacoes_com_custo
        FROM MovimentacaoEstoques me
        LEFT JOIN OrdemServicos os ON me.ordem_servico_id = os.id
        LEFT JOIN Solicitacoes s ON os.solicitacao_id = s.id
        WHERE me.deletedAt IS NULL 
          AND me.created_at BETWEEN :startDate AND :endDate
        GROUP BY DATE_FORMAT(me.created_at, '%Y-%m')
        ORDER BY mes
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      // Itens de maior custo
      const itensMaiorCusto = await sequelize.query(`
        SELECT 
          ie.nome as item,
          ie.codigo,
          cat.nome as categoria,
          SUM(me.quantidade) as quantidade_total,
          SUM(me.valor_total) as valor_total,
          AVG(me.valor_unitario) as valor_medio_unitario,
          COUNT(me.id) as movimentacoes
        FROM MovimentacaoEstoques me
        INNER JOIN ItemEstoques ie ON me.item_id = ie.id
        LEFT JOIN CategoriaEstoques cat ON ie.categoria_id = cat.id
        WHERE me.deletedAt IS NULL 
          AND me.created_at BETWEEN :startDate AND :endDate
        GROUP BY ie.id, ie.nome, ie.codigo, cat.nome
        ORDER BY valor_total DESC
        LIMIT 20
      `, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT
      });

      const titulo = `Custos Operacionais - ${ReportService.formatPeriod(startDate, endDate)}`;

      if (formato === 'excel') {
        const headers = [
          { key: 'departamento', label: 'Departamento', type: 'text' },
          { key: 'total_solicitacoes', label: 'Total Solicitações', type: 'number' },
          { key: 'solicitacoes_concluidas', label: 'Concluídas', type: 'number' },
          { key: 'custos_materiais', label: 'Custos Materiais', type: 'currency', total: 'sum' },
          { key: 'eficiencia_resolucao', label: 'Eficiência (%)', type: 'percentage' },
          { key: 'custo_medio_por_solicitacao', label: 'Custo Médio/Solicitação', type: 'currency' }
        ];

        const excel = await ReportService.generateExcel(roiDepartamentos, {
          title: titulo,
          headers,
          fileName: `custos_operacionais_${Date.now()}.xlsx`,
          totals: true
        });

        res.set({
          'Content-Type': excel.contentType,
          'Content-Disposition': `attachment; filename="${excel.fileName}"`
        });

        return res.send(excel.buffer);
      }

      logBusinessOperation(
        'relatorio_custos_operacionais_gerado',
        req.user.id,
        { 
          periodo: ReportService.formatPeriod(startDate, endDate),
          formato
        }
      );

      res.json({
        success: true,
        data: {
          titulo,
          periodo: ReportService.formatPeriod(startDate, endDate),
          custosEstoque,
          roiDepartamentos,
          tendenciaCustos,
          itensMaiorCusto,
          resumoCustos: {
            totalMovimentado: custosEstoque.reduce((acc, item) => acc + (parseFloat(item.valor_total_movimentado) || 0), 0),
            totalEntradas: custosEstoque.reduce((acc, item) => acc + (parseFloat(item.total_entradas) || 0), 0),
            totalSaidas: custosEstoque.reduce((acc, item) => acc + (parseFloat(item.total_saidas) || 0), 0)
          },
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de custos operacionais:', error);
      next(error);
    }
  }

  /**
   * Calcula KPIs principais do período
   */
  async calculateKPIs(startDate, endDate) {
    const kpis = await sequelize.query(`
      SELECT 
        COUNT(*) as total_solicitacoes,
        COUNT(CASE WHEN status = 'concluida' THEN 1 END) as solicitacoes_concluidas,
        COUNT(CASE WHEN status = 'aberta' THEN 1 END) as solicitacoes_abertas,
        COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as solicitacoes_andamento,
        ROUND(COUNT(CASE WHEN status = 'concluida' THEN 1 END) * 100.0 / COUNT(*), 2) as taxa_conclusao,
        ROUND(AVG(CASE 
          WHEN status = 'concluida' THEN 
            TIMESTAMPDIFF(HOUR, created_at, updated_at)
          ELSE NULL 
        END), 2) as tempo_medio_resolucao,
        COUNT(CASE WHEN prioridade = 'critica' THEN 1 END) as solicitacoes_criticas,
        COUNT(CASE 
          WHEN prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) <= 4 THEN 1
          WHEN prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) <= 24 THEN 1
          WHEN prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) <= 72 THEN 1
          WHEN prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) <= 168 THEN 1
        END) as solicitacoes_dentro_sla,
        ROUND(COUNT(CASE 
          WHEN prioridade = 'critica' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) <= 4 THEN 1
          WHEN prioridade = 'alta' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) <= 24 THEN 1
          WHEN prioridade = 'normal' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) <= 72 THEN 1
          WHEN prioridade = 'baixa' AND TIMESTAMPDIFF(HOUR, created_at, IFNULL(updated_at, NOW())) <= 168 THEN 1
        END) * 100.0 / COUNT(*), 2) as taxa_sla,
        COUNT(DISTINCT solicitante_id) as usuarios_ativos,
        COUNT(DISTINCT responsavel_id) as usuarios_responsaveis
      FROM Solicitacoes 
      WHERE deletedAt IS NULL 
        AND created_at BETWEEN :startDate AND :endDate
    `, {
      replacements: { startDate, endDate },
      type: QueryTypes.SELECT
    });

    return kpis[0];
  }

  /**
   * Calcula variações percentuais entre períodos
   */
  calculateVariations(atual, anterior) {
    const variacoes = {};
    
    Object.keys(atual).forEach(key => {
      if (typeof atual[key] === 'number' && typeof anterior[key] === 'number') {
        if (anterior[key] === 0) {
          variacoes[key] = atual[key] > 0 ? 100 : 0;
        } else {
          variacoes[key] = Math.round(((atual[key] - anterior[key]) / anterior[key]) * 100 * 100) / 100;
        }
      }
    });

    return variacoes;
  }

  /**
   * Gera dados para gráficos do dashboard
   */
  async generateDashboardCharts(startDate, endDate) {
    // Gráfico de solicitações por status
    const statusData = await sequelize.query(`
      SELECT status, COUNT(*) as total
      FROM Solicitacoes 
      WHERE deletedAt IS NULL 
        AND created_at BETWEEN :startDate AND :endDate
      GROUP BY status
    `, {
      replacements: { startDate, endDate },
      type: QueryTypes.SELECT
    });

    // Gráfico de tendência mensal
    const tendenciaData = await sequelize.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as mes,
        COUNT(*) as total
      FROM Solicitacoes 
      WHERE deletedAt IS NULL 
        AND created_at >= DATE_SUB(:startDate, INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY mes
    `, {
      replacements: { startDate },
      type: QueryTypes.SELECT
    });

    return {
      solicitacoesPorStatus: ReportService.generateChartData(statusData, {
        type: 'pie',
        groupBy: 'status',
        valueField: 'total'
      }),
      tendenciaMensal: ReportService.generateChartData(tendenciaData, {
        type: 'line',
        groupBy: 'mes',
        valueField: 'total',
        labelField: 'Total de Solicitações'
      })
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
      ...query
    };
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
}

module.exports = new AnalyticsReportController();