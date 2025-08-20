const sequelize = require('../config/database');
const { Op } = require('sequelize');

class RelatorioService {
  constructor() {
    this.formatters = {
      'currency': (valor) => new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(valor),
      'percentage': (valor) => `${(valor * 100).toFixed(2)}%`,
      'duration': (valor) => this.formatarDuracao(valor),
      'datetime': (valor) => new Date(valor).toLocaleString('pt-BR'),
      'date': (valor) => new Date(valor).toLocaleDateString('pt-BR'),
      'number': (valor) => new Intl.NumberFormat('pt-BR').format(valor)
    };
  }

  formatarDuracao(minutos) {
    if (!minutos) return '0min';
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0) {
      return `${horas}h ${mins}min`;
    }
    return `${mins}min`;
  }

  async executarRelatorio(relatorio, parametros = {}) {
    try {
      switch (relatorio.tipo) {
        case 'ordens_servico':
          return await this.executarRelatorioOrdensServico(relatorio, parametros);
        case 'ativos':
          return await this.executarRelatorioAtivos(relatorio, parametros);
        case 'custos':
          return await this.executarRelatorioCustos(relatorio, parametros);
        case 'disponibilidade':
          return await this.executarRelatorioDisponibilidade(relatorio, parametros);
        case 'produtividade':
          return await this.executarRelatorioProdutividade(relatorio, parametros);
        case 'kpis':
          return await this.executarRelatorioKPIs(relatorio, parametros);
        default:
          throw new Error(`Tipo de relatório não suportado: ${relatorio.tipo}`);
      }
    } catch (error) {
      throw new Error(`Erro na execução do relatório: ${error.message}`);
    }
  }

  async executarRelatorioOrdensServico(relatorio, parametros) {
    const { data_inicio, data_fim, status, setor_id, prioridade } = parametros;
    
    let whereClause = '';
    const replacements = {};

    // Construir WHERE clause
    const conditions = ['1=1'];
    
    if (data_inicio) {
      conditions.push('os.created_at >= :data_inicio');
      replacements.data_inicio = data_inicio;
    }
    
    if (data_fim) {
      conditions.push('os.created_at <= :data_fim');
      replacements.data_fim = data_fim;
    }
    
    if (status && Array.isArray(status)) {
      conditions.push('os.status IN (:status)');
      replacements.status = status;
    }
    
    if (setor_id) {
      conditions.push('os.setor_id = :setor_id');
      replacements.setor_id = setor_id;
    }
    
    if (prioridade) {
      conditions.push('os.prioridade = :prioridade');
      replacements.prioridade = prioridade;
    }

    whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        os.id,
        os.titulo,
        os.descricao,
        os.status,
        os.prioridade,
        os.tipo,
        os.data_agendamento,
        os.data_inicio,
        os.data_conclusao,
        os.custo_estimado,
        os.custo_real,
        u_solicitante.nome as solicitante_nome,
        u_tecnico.nome as tecnico_nome,
        a.nome as ativo_nome,
        a.codigo as ativo_codigo,
        s.nome as setor_nome,
        TIMESTAMPDIFF(HOUR, os.data_inicio, os.data_conclusao) as tempo_resolucao_horas,
        os.created_at,
        os.updated_at
      FROM ordens_servico os
      LEFT JOIN users u_solicitante ON os.solicitante_id = u_solicitante.id
      LEFT JOIN users u_tecnico ON os.tecnico_id = u_tecnico.id
      LEFT JOIN ativos a ON os.ativo_id = a.id
      LEFT JOIN setores s ON os.setor_id = s.id
      WHERE ${whereClause}
      ORDER BY os.created_at DESC
    `;

    const [results] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return this.formatarResultados(results, relatorio.colunas);
  }

  async executarRelatorioAtivos(relatorio, parametros) {
    const { setor_id, categoria_id, status } = parametros;
    
    const conditions = ['1=1'];
    const replacements = {};
    
    if (setor_id) {
      conditions.push('a.setor_id = :setor_id');
      replacements.setor_id = setor_id;
    }
    
    if (categoria_id) {
      conditions.push('a.categoria_id = :categoria_id');
      replacements.categoria_id = categoria_id;
    }
    
    if (status) {
      conditions.push('a.status = :status');
      replacements.status = status;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        a.id,
        a.nome,
        a.codigo,
        a.descricao,
        a.status,
        a.data_aquisicao,
        a.valor_aquisicao,
        a.valor_atual,
        a.localizacao,
        s.nome as setor_nome,
        c.nome as categoria_nome,
        COUNT(os.id) as total_ordens,
        COUNT(CASE WHEN os.status = 'concluida' THEN 1 END) as ordens_concluidas,
        SUM(CASE WHEN os.status = 'concluida' THEN os.custo_real ELSE 0 END) as custo_total_manutencao,
        AVG(CASE WHEN os.status = 'concluida' THEN 
          TIMESTAMPDIFF(HOUR, os.data_inicio, os.data_conclusao) 
        END) as tempo_medio_reparo
      FROM ativos a
      LEFT JOIN setores s ON a.setor_id = s.id
      LEFT JOIN categories c ON a.categoria_id = c.id
      LEFT JOIN ordens_servico os ON a.id = os.ativo_id
      WHERE ${whereClause}
      GROUP BY a.id, a.nome, a.codigo, a.descricao, a.status, 
               a.data_aquisicao, a.valor_aquisicao, a.valor_atual, 
               a.localizacao, s.nome, c.nome
      ORDER BY a.nome
    `;

    const [results] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return this.formatarResultados(results, relatorio.colunas);
  }

  async executarRelatorioCustos(relatorio, parametros) {
    const { data_inicio, data_fim, tipo_manutencao, setor_id } = parametros;
    
    const conditions = ['os.status = "concluida"'];
    const replacements = {};
    
    if (data_inicio) {
      conditions.push('os.data_conclusao >= :data_inicio');
      replacements.data_inicio = data_inicio;
    }
    
    if (data_fim) {
      conditions.push('os.data_conclusao <= :data_fim');
      replacements.data_fim = data_fim;
    }
    
    if (tipo_manutencao) {
      conditions.push('os.tipo = :tipo_manutencao');
      replacements.tipo_manutencao = tipo_manutencao;
    }
    
    if (setor_id) {
      conditions.push('os.setor_id = :setor_id');
      replacements.setor_id = setor_id;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        DATE_FORMAT(os.data_conclusao, '%Y-%m') as mes,
        os.tipo as tipo_manutencao,
        s.nome as setor_nome,
        COUNT(os.id) as numero_ordens,
        SUM(os.custo_real) as custo_total,
        AVG(os.custo_real) as custo_medio,
        MIN(os.custo_real) as custo_minimo,
        MAX(os.custo_real) as custo_maximo,
        SUM(CASE WHEN os.tipo = 'preventiva' THEN os.custo_real ELSE 0 END) as custo_preventiva,
        SUM(CASE WHEN os.tipo = 'corretiva' THEN os.custo_real ELSE 0 END) as custo_corretiva,
        COUNT(CASE WHEN os.tipo = 'preventiva' THEN 1 END) as ordens_preventiva,
        COUNT(CASE WHEN os.tipo = 'corretiva' THEN 1 END) as ordens_corretiva
      FROM ordens_servico os
      LEFT JOIN setores s ON os.setor_id = s.id
      WHERE ${whereClause}
      GROUP BY DATE_FORMAT(os.data_conclusao, '%Y-%m'), os.tipo, s.nome
      ORDER BY mes DESC, tipo_manutencao, setor_nome
    `;

    const [results] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return this.formatarResultados(results, relatorio.colunas);
  }

  async executarRelatorioDisponibilidade(relatorio, parametros) {
    const { periodo = '30_dias', setor_id } = parametros;
    
    const diasPeriodo = {
      '7_dias': 7,
      '30_dias': 30,
      '90_dias': 90
    }[periodo] || 30;

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasPeriodo);

    const conditions = ['1=1'];
    const replacements = { data_limite: dataLimite };
    
    if (setor_id) {
      conditions.push('a.setor_id = :setor_id');
      replacements.setor_id = setor_id;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        a.id,
        a.nome,
        a.codigo,
        s.nome as setor_nome,
        COUNT(os.id) as total_manutencoes,
        SUM(CASE WHEN os.status = 'concluida' THEN 
          TIMESTAMPDIFF(HOUR, os.data_inicio, os.data_conclusao) 
        ELSE 0 END) as horas_inatividade,
        (${diasPeriodo} * 24 - SUM(CASE WHEN os.status = 'concluida' THEN 
          TIMESTAMPDIFF(HOUR, os.data_inicio, os.data_conclusao) 
        ELSE 0 END)) / (${diasPeriodo} * 24) * 100 as disponibilidade_percentual,
        AVG(CASE WHEN os.status = 'concluida' THEN 
          TIMESTAMPDIFF(HOUR, os.data_inicio, os.data_conclusao) 
        END) as tempo_medio_reparo,
        COUNT(CASE WHEN os.tipo = 'preventiva' THEN 1 END) as manutencoes_preventivas,
        COUNT(CASE WHEN os.tipo = 'corretiva' THEN 1 END) as manutencoes_corretivas
      FROM ativos a
      LEFT JOIN setores s ON a.setor_id = s.id
      LEFT JOIN ordens_servico os ON a.id = os.ativo_id 
        AND os.created_at >= :data_limite
      WHERE ${whereClause}
      GROUP BY a.id, a.nome, a.codigo, s.nome
      ORDER BY disponibilidade_percentual DESC
    `;

    const [results] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return this.formatarResultados(results, relatorio.colunas);
  }

  async executarRelatorioProdutividade(relatorio, parametros) {
    const { data_inicio, data_fim, user_id } = parametros;
    
    const conditions = ['os.status = "concluida"'];
    const replacements = {};
    
    if (data_inicio) {
      conditions.push('os.data_conclusao >= :data_inicio');
      replacements.data_inicio = data_inicio;
    }
    
    if (data_fim) {
      conditions.push('os.data_conclusao <= :data_fim');
      replacements.data_fim = data_fim;
    }
    
    if (user_id) {
      conditions.push('os.tecnico_id = :user_id');
      replacements.user_id = user_id;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        u.id as tecnico_id,
        u.nome as tecnico_nome,
        u.email as tecnico_email,
        COUNT(os.id) as ordens_concluidas,
        AVG(TIMESTAMPDIFF(HOUR, os.data_inicio, os.data_conclusao)) as tempo_medio_resolucao,
        SUM(os.custo_real) as custo_total_trabalhos,
        AVG(os.custo_real) as custo_medio_trabalho,
        COUNT(CASE WHEN os.tipo = 'preventiva' THEN 1 END) as trabalhos_preventivos,
        COUNT(CASE WHEN os.tipo = 'corretiva' THEN 1 END) as trabalhos_corretivos,
        COUNT(CASE WHEN os.prioridade = 'critica' THEN 1 END) as trabalhos_criticos,
        (COUNT(CASE WHEN os.tipo = 'preventiva' THEN 1 END) / COUNT(os.id)) * 100 as percentual_preventiva
      FROM users u
      INNER JOIN ordens_servico os ON u.id = os.tecnico_id
      WHERE ${whereClause}
      GROUP BY u.id, u.nome, u.email
      HAVING ordens_concluidas > 0
      ORDER BY ordens_concluidas DESC, tempo_medio_resolucao ASC
    `;

    const [results] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return this.formatarResultados(results, relatorio.colunas);
  }

  async executarRelatorioKPIs(relatorio, parametros) {
    const { periodo = '30_dias' } = parametros;
    
    const diasPeriodo = {
      '7_dias': 7,
      '30_dias': 30,
      '90_dias': 90
    }[periodo] || 30;

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasPeriodo);

    const query = `
      SELECT 
        'Eficiência de Manutenção' as kpi,
        ROUND((COUNT(CASE WHEN os.tipo = 'preventiva' THEN 1 END) / COUNT(os.id)) * 100, 2) as valor,
        '%' as unidade,
        'Alto' as categoria
      FROM ordens_servico os 
      WHERE os.created_at >= :data_limite
      
      UNION ALL
      
      SELECT 
        'Tempo Médio de Resolução' as kpi,
        ROUND(AVG(CASE WHEN os.status = 'concluida' THEN 
          TIMESTAMPDIFF(HOUR, os.data_inicio, os.data_conclusao) 
        END), 2) as valor,
        'horas' as unidade,
        'Operacional' as categoria
      FROM ordens_servico os 
      WHERE os.created_at >= :data_limite
      
      UNION ALL
      
      SELECT 
        'Custo Médio por Ordem' as kpi,
        ROUND(AVG(os.custo_real), 2) as valor,
        'R$' as unidade,
        'Financeiro' as categoria
      FROM ordens_servico os 
      WHERE os.created_at >= :data_limite AND os.status = 'concluida'
      
      UNION ALL
      
      SELECT 
        'Taxa de Ordens Urgentes' as kpi,
        ROUND((COUNT(CASE WHEN os.prioridade IN ('alta', 'critica') THEN 1 END) / COUNT(os.id)) * 100, 2) as valor,
        '%' as unidade,
        'Qualidade' as categoria
      FROM ordens_servico os 
      WHERE os.created_at >= :data_limite
      
      ORDER BY categoria, kpi
    `;

    const [results] = await sequelize.query(query, {
      replacements: { data_limite: dataLimite },
      type: sequelize.QueryTypes.SELECT
    });

    return this.formatarResultados(results, relatorio.colunas);
  }

  formatarResultados(dados, colunas) {
    if (!dados || dados.length === 0) {
      return {
        dados: [],
        resumo: {
          total_registros: 0,
          colunas: colunas
        }
      };
    }

    const dadosFormatados = dados.map(linha => {
      const linhaFormatada = {};
      
      colunas.forEach(coluna => {
        const valor = linha[coluna.nome];
        
        if (valor !== null && valor !== undefined) {
          if (coluna.tipo && this.formatters[coluna.tipo]) {
            linhaFormatada[coluna.nome] = this.formatters[coluna.tipo](valor);
            linhaFormatada[`${coluna.nome}_raw`] = valor; // Manter valor original
          } else {
            linhaFormatada[coluna.nome] = valor;
          }
        } else {
          linhaFormatada[coluna.nome] = '-';
        }
      });
      
      return linhaFormatada;
    });

    return {
      dados: dadosFormatados,
      resumo: {
        total_registros: dados.length,
        colunas: colunas,
        gerado_em: new Date().toISOString()
      }
    };
  }

  async obterMetricasCalculadas(periodo = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodo);

    const metricas = {};

    // Eficiência de Manutenção (% de preventivas)
    const [eficiencia] = await sequelize.query(`
      SELECT 
        (COUNT(CASE WHEN tipo = 'preventiva' THEN 1 END) / COUNT(*)) * 100 as eficiencia
      FROM ordens_servico 
      WHERE created_at >= :data_limite
    `, {
      replacements: { data_limite: dataLimite },
      type: sequelize.QueryTypes.SELECT
    });
    metricas.eficiencia_manutencao = eficiencia[0]?.eficiencia || 0;

    // Tempo Médio de Resolução
    const [tempoMedio] = await sequelize.query(`
      SELECT 
        AVG(TIMESTAMPDIFF(HOUR, data_inicio, data_conclusao)) as tempo_medio
      FROM ordens_servico 
      WHERE status = 'concluida' AND created_at >= :data_limite
    `, {
      replacements: { data_limite: dataLimite },
      type: sequelize.QueryTypes.SELECT
    });
    metricas.tempo_medio_resolucao = tempoMedio[0]?.tempo_medio || 0;

    // Custo Médio de Manutenção
    const [custoMedio] = await sequelize.query(`
      SELECT 
        AVG(custo_real) as custo_medio
      FROM ordens_servico 
      WHERE status = 'concluida' AND created_at >= :data_limite
    `, {
      replacements: { data_limite: dataLimite },
      type: sequelize.QueryTypes.SELECT
    });
    metricas.custo_manutencao = custoMedio[0]?.custo_medio || 0;

    return metricas;
  }

  async gerarResumoExecutivo(periodo = 30) {
    const metricas = await this.obterMetricasCalculadas(periodo);
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodo);

    const [dados] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_ordens,
        COUNT(CASE WHEN status = 'concluida' THEN 1 END) as ordens_concluidas,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as ordens_pendentes,
        COUNT(CASE WHEN tipo = 'preventiva' THEN 1 END) as manutencoes_preventivas,
        COUNT(CASE WHEN tipo = 'corretiva' THEN 1 END) as manutencoes_corretivas,
        SUM(CASE WHEN status = 'concluida' THEN custo_real ELSE 0 END) as custo_total,
        COUNT(DISTINCT ativo_id) as ativos_envolvidos,
        COUNT(DISTINCT tecnico_id) as tecnicos_ativos
      FROM ordens_servico 
      WHERE created_at >= :data_limite
    `, {
      replacements: { data_limite: dataLimite },
      type: sequelize.QueryTypes.SELECT
    });

    return {
      periodo_dias: periodo,
      metricas_calculadas: metricas,
      estatisticas_gerais: dados[0],
      gerado_em: new Date().toISOString()
    };
  }
}

module.exports = new RelatorioService();