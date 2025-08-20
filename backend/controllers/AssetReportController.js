const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const ReportService = require('../services/ReportService');
const logger = require('../config/logger');
const { logBusinessOperation } = require('../middleware/performance');

/**
 * Controller para relatórios de estoque e ativos
 */
class AssetReportController {

  /**
   * Relatório de movimentação de estoque
   */
  async relatorioMovimentacaoEstoque(req, res, next) {
    try {
      const { startDate, endDate, tipo_movimentacao, item_id, formato = 'json' } = this.getFilters(req.query);

      const whereConditions = ['me.deletedAt IS NULL'];
      const replacements = { startDate, endDate };

      if (startDate && endDate) {
        whereConditions.push('me.created_at BETWEEN :startDate AND :endDate');
      }

      if (tipo_movimentacao) {
        whereConditions.push('me.tipo_movimentacao = :tipo_movimentacao');
        replacements.tipo_movimentacao = tipo_movimentacao;
      }

      if (item_id) {
        whereConditions.push('me.item_id = :item_id');
        replacements.item_id = item_id;
      }

      const whereClause = whereConditions.join(' AND ');

      const movimentacoes = await sequelize.query(`
        SELECT 
          me.created_at as data_movimentacao,
          me.tipo_movimentacao,
          me.quantidade,
          me.valor_unitario,
          me.valor_total,
          me.motivo,
          ie.nome as item_nome,
          ie.codigo as item_codigo,
          ie.unidade_medida,
          cat.nome as categoria,
          forn.nome as fornecedor,
          user.nome as responsavel,
          os.numero as ordem_servico
        FROM MovimentacaoEstoques me
        INNER JOIN ItemEstoques ie ON me.item_id = ie.id
        LEFT JOIN CategoriaEstoques cat ON ie.categoria_id = cat.id
        LEFT JOIN Fornecedors forn ON ie.fornecedor_id = forn.id
        LEFT JOIN Users user ON me.user_id = user.id
        LEFT JOIN OrdemServicos os ON me.ordem_servico_id = os.id
        WHERE ${whereClause}
        ORDER BY me.created_at DESC
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Estatísticas do período
      const estatisticas = await sequelize.query(`
        SELECT 
          tipo_movimentacao,
          COUNT(*) as total_movimentacoes,
          SUM(quantidade) as total_quantidade,
          SUM(valor_total) as valor_total,
          AVG(valor_unitario) as valor_medio_unitario
        FROM MovimentacaoEstoques me
        WHERE ${whereClause}
        GROUP BY tipo_movimentacao
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Itens mais movimentados
      const itensMaisMovimentados = await sequelize.query(`
        SELECT 
          ie.nome as item_nome,
          ie.codigo as item_codigo,
          COUNT(me.id) as total_movimentacoes,
          SUM(CASE WHEN me.tipo_movimentacao = 'entrada' THEN me.quantidade ELSE 0 END) as total_entradas,
          SUM(CASE WHEN me.tipo_movimentacao = 'saida' THEN me.quantidade ELSE 0 END) as total_saidas,
          SUM(me.valor_total) as valor_total_movimentado
        FROM ItemEstoques ie
        INNER JOIN MovimentacaoEstoques me ON ie.id = me.item_id
        WHERE ${whereClause}
        GROUP BY ie.id, ie.nome, ie.codigo
        ORDER BY total_movimentacoes DESC
        LIMIT 20
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      const titulo = `Movimentação de Estoque - ${ReportService.formatPeriod(startDate, endDate)}`;

      if (formato === 'excel') {
        const headers = [
          { key: 'data_movimentacao', label: 'Data', type: 'datetime' },
          { key: 'tipo_movimentacao', label: 'Tipo', type: 'text' },
          { key: 'item_nome', label: 'Item', type: 'text' },
          { key: 'item_codigo', label: 'Código', type: 'text' },
          { key: 'quantidade', label: 'Quantidade', type: 'number' },
          { key: 'unidade_medida', label: 'Unidade', type: 'text' },
          { key: 'valor_unitario', label: 'Valor Unit.', type: 'currency' },
          { key: 'valor_total', label: 'Valor Total', type: 'currency', total: 'sum' },
          { key: 'motivo', label: 'Motivo', type: 'text' },
          { key: 'categoria', label: 'Categoria', type: 'text' },
          { key: 'fornecedor', label: 'Fornecedor', type: 'text' },
          { key: 'responsavel', label: 'Responsável', type: 'text' },
          { key: 'ordem_servico', label: 'OS', type: 'text' }
        ];

        const excel = await ReportService.generateExcel(movimentacoes, {
          title: titulo,
          headers,
          fileName: `movimentacao_estoque_${Date.now()}.xlsx`,
          totals: true
        });

        res.set({
          'Content-Type': excel.contentType,
          'Content-Disposition': `attachment; filename="${excel.fileName}"`
        });

        return res.send(excel.buffer);
      }

      logBusinessOperation(
        'relatorio_movimentacao_estoque_gerado',
        req.user.id,
        { 
          periodo: ReportService.formatPeriod(startDate, endDate),
          total: movimentacoes.length,
          formato
        }
      );

      res.json({
        success: true,
        data: {
          titulo,
          periodo: ReportService.formatPeriod(startDate, endDate),
          filtros: { tipo_movimentacao, item_id },
          estatisticas,
          itensMaisMovimentados,
          movimentacoes,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de movimentação de estoque:', error);
      next(error);
    }
  }

  /**
   * Relatório de inventário atual
   */
  async relatorioInventario(req, res, next) {
    try {
      const { categoria_id, fornecedor_id, status = 'ativo', formato = 'json' } = req.query;

      const whereConditions = ['ie.deletedAt IS NULL'];
      const replacements = {};

      if (categoria_id) {
        whereConditions.push('ie.categoria_id = :categoria_id');
        replacements.categoria_id = categoria_id;
      }

      if (fornecedor_id) {
        whereConditions.push('ie.fornecedor_id = :fornecedor_id');
        replacements.fornecedor_id = fornecedor_id;
      }

      if (status) {
        whereConditions.push('ie.status = :status');
        replacements.status = status;
      }

      const whereClause = whereConditions.join(' AND ');

      const inventario = await sequelize.query(`
        SELECT 
          ie.codigo,
          ie.nome,
          ie.descricao,
          ie.quantidade_atual,
          ie.quantidade_minima,
          ie.quantidade_maxima,
          ie.valor_unitario,
          ie.quantidade_atual * ie.valor_unitario as valor_total_estoque,
          ie.unidade_medida,
          ie.localizacao,
          ie.status,
          cat.nome as categoria,
          forn.nome as fornecedor,
          CASE 
            WHEN ie.quantidade_atual <= ie.quantidade_minima THEN 'CRÍTICO'
            WHEN ie.quantidade_atual <= (ie.quantidade_minima * 1.2) THEN 'BAIXO'
            WHEN ie.quantidade_atual >= ie.quantidade_maxima THEN 'EXCESSO'
            ELSE 'NORMAL'
          END as status_estoque,
          ie.ultima_movimentacao,
          DATEDIFF(NOW(), ie.ultima_movimentacao) as dias_sem_movimentacao
        FROM ItemEstoques ie
        LEFT JOIN CategoriaEstoques cat ON ie.categoria_id = cat.id
        LEFT JOIN Fornecedors forn ON ie.fornecedor_id = forn.id
        WHERE ${whereClause}
        ORDER BY ie.nome
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Resumo do inventário
      const resumo = await sequelize.query(`
        SELECT 
          COUNT(*) as total_itens,
          SUM(ie.quantidade_atual * ie.valor_unitario) as valor_total_inventario,
          COUNT(CASE WHEN ie.quantidade_atual <= ie.quantidade_minima THEN 1 END) as itens_criticos,
          COUNT(CASE WHEN ie.quantidade_atual <= (ie.quantidade_minima * 1.2) THEN 1 END) as itens_baixos,
          COUNT(CASE WHEN ie.quantidade_atual >= ie.quantidade_maxima THEN 1 END) as itens_excesso,
          COUNT(CASE WHEN DATEDIFF(NOW(), ie.ultima_movimentacao) > 90 THEN 1 END) as itens_sem_movimento
        FROM ItemEstoques ie
        WHERE ${whereClause}
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Categorias com maior valor
      const categoriasPorValor = await sequelize.query(`
        SELECT 
          cat.nome as categoria,
          COUNT(ie.id) as total_itens,
          SUM(ie.quantidade_atual * ie.valor_unitario) as valor_total,
          AVG(ie.quantidade_atual * ie.valor_unitario) as valor_medio_item
        FROM ItemEstoques ie
        LEFT JOIN CategoriaEstoques cat ON ie.categoria_id = cat.id
        WHERE ${whereClause}
        GROUP BY cat.id, cat.nome
        ORDER BY valor_total DESC
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      const titulo = `Inventário de Estoque - ${new Date().toLocaleDateString('pt-BR')}`;

      if (formato === 'excel') {
        const headers = [
          { key: 'codigo', label: 'Código', type: 'text' },
          { key: 'nome', label: 'Item', type: 'text' },
          { key: 'categoria', label: 'Categoria', type: 'text' },
          { key: 'quantidade_atual', label: 'Qtd Atual', type: 'number' },
          { key: 'quantidade_minima', label: 'Qtd Mínima', type: 'number' },
          { key: 'quantidade_maxima', label: 'Qtd Máxima', type: 'number' },
          { key: 'unidade_medida', label: 'Unidade', type: 'text' },
          { key: 'valor_unitario', label: 'Valor Unit.', type: 'currency' },
          { key: 'valor_total_estoque', label: 'Valor Total', type: 'currency', total: 'sum' },
          { key: 'status_estoque', label: 'Status Estoque', type: 'text' },
          { key: 'localizacao', label: 'Localização', type: 'text' },
          { key: 'fornecedor', label: 'Fornecedor', type: 'text' },
          { key: 'dias_sem_movimentacao', label: 'Dias s/ Movimento', type: 'number' }
        ];

        const excel = await ReportService.generateExcel(inventario, {
          title: titulo,
          headers,
          fileName: `inventario_${Date.now()}.xlsx`,
          totals: true
        });

        res.set({
          'Content-Type': excel.contentType,
          'Content-Disposition': `attachment; filename="${excel.fileName}"`
        });

        return res.send(excel.buffer);
      }

      logBusinessOperation(
        'relatorio_inventario_gerado',
        req.user.id,
        { 
          total: inventario.length,
          valor_total: resumo[0]?.valor_total_inventario,
          formato
        }
      );

      res.json({
        success: true,
        data: {
          titulo,
          dataGeracao: new Date().toLocaleDateString('pt-BR'),
          filtros: { categoria_id, fornecedor_id, status },
          resumo: resumo[0],
          categoriasPorValor,
          inventario,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de inventário:', error);
      next(error);
    }
  }

  /**
   * Relatório de controle de ativos
   */
  async relatorioAtivos(req, res, next) {
    try {
      const { status, setor_id, categoria, formato = 'json' } = req.query;

      const whereConditions = ['a.deletedAt IS NULL'];
      const replacements = {};

      if (status) {
        whereConditions.push('a.status = :status');
        replacements.status = status;
      }

      if (setor_id) {
        whereConditions.push('a.setor_id = :setor_id');
        replacements.setor_id = setor_id;
      }

      if (categoria) {
        whereConditions.push('a.categoria = :categoria');
        replacements.categoria = categoria;
      }

      const whereClause = whereConditions.join(' AND ');

      const ativos = await sequelize.query(`
        SELECT 
          a.codigo,
          a.nome,
          a.descricao,
          a.categoria,
          a.status,
          a.valor_aquisicao,
          a.data_aquisicao,
          a.vida_util_anos,
          a.localizacao,
          s.nome as setor,
          a.responsavel_nome,
          a.observacoes,
          YEAR(CURDATE()) - YEAR(a.data_aquisicao) as idade_anos,
          CASE 
            WHEN YEAR(CURDATE()) - YEAR(a.data_aquisicao) >= a.vida_util_anos THEN 'DEPRECIADO'
            WHEN YEAR(CURDATE()) - YEAR(a.data_aquisicao) >= (a.vida_util_anos * 0.8) THEN 'PRÓXIMO DEPRECIAÇÃO'
            ELSE 'ATIVO'
          END as status_depreciacao,
          a.valor_aquisicao - (a.valor_aquisicao * (YEAR(CURDATE()) - YEAR(a.data_aquisicao)) / a.vida_util_anos) as valor_atual_estimado
        FROM Ativos a
        LEFT JOIN Setors s ON a.setor_id = s.id
        WHERE ${whereClause}
        ORDER BY a.nome
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Resumo dos ativos
      const resumoAtivos = await sequelize.query(`
        SELECT 
          COUNT(*) as total_ativos,
          SUM(a.valor_aquisicao) as valor_total_aquisicao,
          COUNT(CASE WHEN a.status = 'ativo' THEN 1 END) as ativos_ativos,
          COUNT(CASE WHEN a.status = 'manutencao' THEN 1 END) as ativos_manutencao,
          COUNT(CASE WHEN a.status = 'inativo' THEN 1 END) as ativos_inativos,
          COUNT(CASE WHEN YEAR(CURDATE()) - YEAR(a.data_aquisicao) >= a.vida_util_anos THEN 1 END) as ativos_depreciados,
          AVG(YEAR(CURDATE()) - YEAR(a.data_aquisicao)) as idade_media_anos
        FROM Ativos a
        WHERE ${whereClause}
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Ativos por categoria
      const ativosPorCategoria = await sequelize.query(`
        SELECT 
          a.categoria,
          COUNT(*) as total_ativos,
          SUM(a.valor_aquisicao) as valor_total,
          AVG(a.valor_aquisicao) as valor_medio,
          COUNT(CASE WHEN a.status = 'ativo' THEN 1 END) as ativos_operacionais
        FROM Ativos a
        WHERE ${whereClause}
        GROUP BY a.categoria
        ORDER BY valor_total DESC
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Ativos por setor
      const ativosPorSetor = await sequelize.query(`
        SELECT 
          s.nome as setor,
          COUNT(a.id) as total_ativos,
          SUM(a.valor_aquisicao) as valor_total,
          COUNT(CASE WHEN a.status = 'ativo' THEN 1 END) as ativos_operacionais,
          COUNT(CASE WHEN a.status = 'manutencao' THEN 1 END) as ativos_manutencao
        FROM Setors s
        LEFT JOIN Ativos a ON s.id = a.setor_id AND ${whereClause.replace('a.deletedAt IS NULL', 'a.deletedAt IS NULL')}
        WHERE s.deletedAt IS NULL
        GROUP BY s.id, s.nome
        HAVING total_ativos > 0
        ORDER BY valor_total DESC
      `, {
        replacements,
        type: QueryTypes.SELECT
      });

      const titulo = `Controle de Ativos - ${new Date().toLocaleDateString('pt-BR')}`;

      if (formato === 'excel') {
        const headers = [
          { key: 'codigo', label: 'Código', type: 'text' },
          { key: 'nome', label: 'Ativo', type: 'text' },
          { key: 'categoria', label: 'Categoria', type: 'text' },
          { key: 'status', label: 'Status', type: 'text' },
          { key: 'setor', label: 'Setor', type: 'text' },
          { key: 'localizacao', label: 'Localização', type: 'text' },
          { key: 'responsavel_nome', label: 'Responsável', type: 'text' },
          { key: 'valor_aquisicao', label: 'Valor Aquisição', type: 'currency', total: 'sum' },
          { key: 'data_aquisicao', label: 'Data Aquisição', type: 'date' },
          { key: 'vida_util_anos', label: 'Vida Útil (anos)', type: 'number' },
          { key: 'idade_anos', label: 'Idade (anos)', type: 'number' },
          { key: 'status_depreciacao', label: 'Status Depreciação', type: 'text' },
          { key: 'valor_atual_estimado', label: 'Valor Atual Est.', type: 'currency' }
        ];

        const excel = await ReportService.generateExcel(ativos, {
          title: titulo,
          headers,
          fileName: `ativos_${Date.now()}.xlsx`,
          totals: true
        });

        res.set({
          'Content-Type': excel.contentType,
          'Content-Disposition': `attachment; filename="${excel.fileName}"`
        });

        return res.send(excel.buffer);
      }

      logBusinessOperation(
        'relatorio_ativos_gerado',
        req.user.id,
        { 
          total: ativos.length,
          valor_total: resumoAtivos[0]?.valor_total_aquisicao,
          formato
        }
      );

      res.json({
        success: true,
        data: {
          titulo,
          dataGeracao: new Date().toLocaleDateString('pt-BR'),
          filtros: { status, setor_id, categoria },
          resumoAtivos: resumoAtivos[0],
          ativosPorCategoria,
          ativosPorSetor,
          ativos,
          geradoEm: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de ativos:', error);
      next(error);
    }
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

module.exports = new AssetReportController();