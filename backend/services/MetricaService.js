const Metrica = require('../models/Metrica');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

class MetricaService {
  
  async calcularEficienciaManutencao(dataInicio, dataFim) {
    const [resultado] = await sequelize.query(`
      SELECT 
        (COUNT(CASE WHEN tipo = 'preventiva' THEN 1 END) / COUNT(*)) * 100 as eficiencia
      FROM ordens_servico 
      WHERE created_at BETWEEN :dataInicio AND :dataFim
    `, {
      replacements: { dataInicio, dataFim },
      type: sequelize.QueryTypes.SELECT
    });

    const valor = resultado[0]?.eficiencia || 0;
    
    return await this.criarMetrica({
      tipo: 'eficiencia_manutencao',
      nome: 'Eficiência de Manutenção',
      descricao: 'Percentual de manutenções preventivas sobre o total',
      valor: valor,
      unidade: '%',
      periodo: 'mensal',
      data_inicio: dataInicio,
      data_fim: dataFim,
      categoria: 'operacional',
      calculado_automaticamente: true
    });
  }

  async calcularTempoMedioResolucao(dataInicio, dataFim, ativoId = null, setorId = null) {
    let whereClause = 'WHERE status = "concluida" AND created_at BETWEEN :dataInicio AND :dataFim';
    const replacements = { dataInicio, dataFim };

    if (ativoId) {
      whereClause += ' AND ativo_id = :ativoId';
      replacements.ativoId = ativoId;
    }

    if (setorId) {
      whereClause += ' AND setor_id = :setorId';
      replacements.setorId = setorId;
    }

    const [resultado] = await sequelize.query(`
      SELECT 
        AVG(TIMESTAMPDIFF(HOUR, data_inicio, data_conclusao)) as tempo_medio
      FROM ordens_servico 
      ${whereClause}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const valor = resultado[0]?.tempo_medio || 0;
    
    return await this.criarMetrica({
      tipo: 'tempo_medio_resolucao',
      nome: 'Tempo Médio de Resolução',
      descricao: 'Tempo médio para resolver ordens de serviço',
      valor: valor,
      unidade: 'horas',
      periodo: 'mensal',
      data_inicio: dataInicio,
      data_fim: dataFim,
      ativo_id: ativoId,
      setor_id: setorId,
      categoria: 'performance',
      calculado_automaticamente: true
    });
  }

  async calcularDisponibilidadeAtivo(ativoId, dataInicio, dataFim) {
    const [resultado] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(TIMESTAMPDIFF(HOUR, data_inicio, data_conclusao)), 0) as horas_inatividade
      FROM ordens_servico 
      WHERE ativo_id = :ativoId 
      AND status = 'concluida'
      AND created_at BETWEEN :dataInicio AND :dataFim
    `, {
      replacements: { ativoId, dataInicio, dataFim },
      type: sequelize.QueryTypes.SELECT
    });

    const horasInatividade = resultado[0]?.horas_inatividade || 0;
    const horasPeriodo = (new Date(dataFim) - new Date(dataInicio)) / (1000 * 60 * 60);
    const disponibilidade = ((horasPeriodo - horasInatividade) / horasPeriodo) * 100;

    return await this.criarMetrica({
      tipo: 'disponibilidade_ativo',
      nome: 'Disponibilidade do Ativo',
      descricao: 'Percentual de tempo que o ativo esteve disponível',
      valor: Math.max(0, disponibilidade),
      unidade: '%',
      periodo: 'mensal',
      data_inicio: dataInicio,
      data_fim: dataFim,
      ativo_id: ativoId,
      categoria: 'disponibilidade',
      calculado_automaticamente: true
    });
  }

  async calcularCustoManutencao(dataInicio, dataFim, ativoId = null, setorId = null) {
    let whereClause = 'WHERE status = "concluida" AND created_at BETWEEN :dataInicio AND :dataFim';
    const replacements = { dataInicio, dataFim };

    if (ativoId) {
      whereClause += ' AND ativo_id = :ativoId';
      replacements.ativoId = ativoId;
    }

    if (setorId) {
      whereClause += ' AND setor_id = :setorId';
      replacements.setorId = setorId;
    }

    const [resultado] = await sequelize.query(`
      SELECT 
        SUM(custo_real) as custo_total,
        COUNT(*) as total_ordens,
        AVG(custo_real) as custo_medio
      FROM ordens_servico 
      ${whereClause}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const custoTotal = resultado[0]?.custo_total || 0;
    
    return await this.criarMetrica({
      tipo: 'custo_manutencao',
      nome: 'Custo Total de Manutenção',
      descricao: 'Custo total gasto em manutenções no período',
      valor: custoTotal,
      unidade: 'R$',
      periodo: 'mensal',
      data_inicio: dataInicio,
      data_fim: dataFim,
      ativo_id: ativoId,
      setor_id: setorId,
      categoria: 'financeiro',
      metadata: {
        custo_medio: resultado[0]?.custo_medio || 0,
        total_ordens: resultado[0]?.total_ordens || 0
      },
      calculado_automaticamente: true
    });
  }

  async calcularProdutividadeTecnico(tecnicoId, dataInicio, dataFim) {
    const [resultado] = await sequelize.query(`
      SELECT 
        COUNT(*) as ordens_concluidas,
        AVG(TIMESTAMPDIFF(HOUR, data_inicio, data_conclusao)) as tempo_medio,
        SUM(custo_real) as custo_total_trabalhos
      FROM ordens_servico 
      WHERE tecnico_id = :tecnicoId 
      AND status = 'concluida'
      AND created_at BETWEEN :dataInicio AND :dataFim
    `, {
      replacements: { tecnicoId, dataInicio, dataFim },
      type: sequelize.QueryTypes.SELECT
    });

    const ordensCompletas = resultado[0]?.ordens_concluidas || 0;
    const produtividade = ordensCompletas / ((new Date(dataFim) - new Date(dataInicio)) / (1000 * 60 * 60 * 24 * 7)); // Ordens por semana

    return await this.criarMetrica({
      tipo: 'produtividade_tecnico',
      nome: 'Produtividade do Técnico',
      descricao: 'Número médio de ordens concluídas por semana',
      valor: produtividade,
      unidade: 'ordens/semana',
      periodo: 'mensal',
      data_inicio: dataInicio,
      data_fim: dataFim,
      user_id: tecnicoId,
      categoria: 'performance',
      metadata: {
        ordens_concluidas: ordensCompletas,
        tempo_medio_resolucao: resultado[0]?.tempo_medio || 0,
        custo_total_trabalhos: resultado[0]?.custo_total_trabalhos || 0
      },
      calculado_automaticamente: true
    });
  }

  async calcularTaxaRetrabalho(dataInicio, dataFim) {
    const [resultado] = await sequelize.query(`
      SELECT 
        COUNT(CASE WHEN (
          SELECT COUNT(*) FROM ordens_servico os2 
          WHERE os2.ativo_id = os1.ativo_id 
          AND os2.created_at > os1.data_conclusao 
          AND os2.created_at <= DATE_ADD(os1.data_conclusao, INTERVAL 7 DAY)
          AND os2.tipo = 'corretiva'
        ) > 0 THEN 1 END) as retrabalhos,
        COUNT(*) as total_ordens
      FROM ordens_servico os1
      WHERE os1.status = 'concluida' 
      AND os1.created_at BETWEEN :dataInicio AND :dataFim
    `, {
      replacements: { dataInicio, dataFim },
      type: sequelize.QueryTypes.SELECT
    });

    const retrabalhos = resultado[0]?.retrabalhos || 0;
    const totalOrdens = resultado[0]?.total_ordens || 0;
    const taxaRetrabalho = totalOrdens > 0 ? (retrabalhos / totalOrdens) * 100 : 0;

    return await this.criarMetrica({
      tipo: 'taxa_retrabalho',
      nome: 'Taxa de Retrabalho',
      descricao: 'Percentual de manutenções que geraram retrabalho em 7 dias',
      valor: taxaRetrabalho,
      unidade: '%',
      periodo: 'mensal',
      data_inicio: dataInicio,
      data_fim: dataFim,
      categoria: 'qualidade',
      metadata: {
        retrabalhos: retrabalhos,
        total_ordens: totalOrdens
      },
      calculado_automaticamente: true
    });
  }

  async criarMetrica(dadosMetrica) {
    try {
      // Verificar se já existe métrica similar
      const metricaExistente = await Metrica.findOne({
        where: {
          tipo: dadosMetrica.tipo,
          data_inicio: dadosMetrica.data_inicio,
          data_fim: dadosMetrica.data_fim,
          ativo_id: dadosMetrica.ativo_id || null,
          setor_id: dadosMetrica.setor_id || null,
          user_id: dadosMetrica.user_id || null
        }
      });

      if (metricaExistente) {
        // Atualizar métrica existente
        await metricaExistente.update({
          valor: dadosMetrica.valor,
          metadata: dadosMetrica.metadata,
          updated_at: new Date()
        });
        return metricaExistente;
      } else {
        // Criar nova métrica
        return await Metrica.create(dadosMetrica);
      }
    } catch (error) {
      throw new Error(`Erro ao criar métrica: ${error.message}`);
    }
  }

  async calcularTodasMetricasPeriodo(dataInicio, dataFim) {
    const metricas = [];

    try {
      // Eficiência de Manutenção
      metricas.push(await this.calcularEficienciaManutencao(dataInicio, dataFim));

      // Tempo Médio de Resolução Geral
      metricas.push(await this.calcularTempoMedioResolucao(dataInicio, dataFim));

      // Custo Total de Manutenção
      metricas.push(await this.calcularCustoManutencao(dataInicio, dataFim));

      // Taxa de Retrabalho
      metricas.push(await this.calcularTaxaRetrabalho(dataInicio, dataFim));

      // Métricas por ativo (dos ativos mais ativos)
      const [ativosAtivos] = await sequelize.query(`
        SELECT DISTINCT ativo_id
        FROM ordens_servico 
        WHERE created_at BETWEEN :dataInicio AND :dataFim
        AND ativo_id IS NOT NULL
        ORDER BY ativo_id
        LIMIT 10
      `, {
        replacements: { dataInicio, dataFim },
        type: sequelize.QueryTypes.SELECT
      });

      for (const ativo of ativosAtivos) {
        metricas.push(await this.calcularDisponibilidadeAtivo(ativo.ativo_id, dataInicio, dataFim));
        metricas.push(await this.calcularTempoMedioResolucao(dataInicio, dataFim, ativo.ativo_id));
        metricas.push(await this.calcularCustoManutencao(dataInicio, dataFim, ativo.ativo_id));
      }

      // Métricas por técnico (dos técnicos mais ativos)
      const [tecnicosAtivos] = await sequelize.query(`
        SELECT DISTINCT tecnico_id
        FROM ordens_servico 
        WHERE created_at BETWEEN :dataInicio AND :dataFim
        AND tecnico_id IS NOT NULL
        AND status = 'concluida'
        ORDER BY tecnico_id
        LIMIT 5
      `, {
        replacements: { dataInicio, dataFim },
        type: sequelize.QueryTypes.SELECT
      });

      for (const tecnico of tecnicosAtivos) {
        metricas.push(await this.calcularProdutividadeTecnico(tecnico.tecnico_id, dataInicio, dataFim));
      }

      return metricas.filter(m => m !== null);
    } catch (error) {
      throw new Error(`Erro ao calcular métricas: ${error.message}`);
    }
  }

  async obterTendencia(tipo, ativoId = null, setorId = null, userId = null) {
    const where = {
      tipo: tipo,
      ativo: true
    };

    if (ativoId) where.ativo_id = ativoId;
    if (setorId) where.setor_id = setorId;
    if (userId) where.user_id = userId;

    const metricas = await Metrica.findAll({
      where,
      order: [['data_inicio', 'ASC']],
      limit: 12 // Últimos 12 períodos
    });

    if (metricas.length < 2) {
      return 'estavel';
    }

    const valores = metricas.map(m => parseFloat(m.valor));
    const ultimoValor = valores[valores.length - 1];
    const penultimoValor = valores[valores.length - 2];
    const mediaAnterior = valores.slice(0, -1).reduce((a, b) => a + b, 0) / (valores.length - 1);

    // Calcular tendência
    if (ultimoValor > mediaAnterior * 1.1) {
      return 'crescente';
    } else if (ultimoValor < mediaAnterior * 0.9) {
      return 'decrescente';
    } else if (Math.abs(ultimoValor - penultimoValor) > mediaAnterior * 0.2) {
      return 'volatil';
    } else {
      return 'estavel';
    }
  }

  async atualizarMetas(tipo, novasMetas) {
    return await Metrica.update(
      { 
        meta: novasMetas.valor,
        status_meta: null // Recalcular status na próxima atualização
      },
      {
        where: {
          tipo: tipo,
          ativo: true
        }
      }
    );
  }

  async obterResumoKPIs(periodo = 30) {
    const dataFim = new Date();
    const dataInicio = new Date(dataFim.getTime() - periodo * 24 * 60 * 60 * 1000);

    const kpis = await Metrica.findAll({
      where: {
        tipo: ['eficiencia_manutencao', 'tempo_medio_resolucao', 'custo_manutencao', 'disponibilidade_ativo'],
        data_inicio: { [Op.gte]: dataInicio },
        data_fim: { [Op.lte]: dataFim },
        ativo: true
      },
      order: [['created_at', 'DESC']]
    });

    const resumo = {};
    
    kpis.forEach(kpi => {
      if (!resumo[kpi.tipo] || resumo[kpi.tipo].created_at < kpi.created_at) {
        resumo[kpi.tipo] = kpi;
      }
    });

    return Object.values(resumo);
  }
}

module.exports = new MetricaService();