const Metrica = require('../models/Metrica');
const Dashboard = require('../models/Dashboard');
const Relatorio = require('../models/Relatorio');
const RelatorioExecucao = require('../models/RelatorioExecucao');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class AnalyticsController {
  // ==================== MÉTRICAS ====================
  
  // Listar métricas com filtros
  async listarMetricas(req, res) {
    try {
      const {
        tipo,
        periodo,
        ativo_id,
        setor_id,
        user_id,
        categoria,
        data_inicio,
        data_fim,
        page = 1,
        limit = 50
      } = req.query;

      const where = { ativo: true };
      
      if (tipo) where.tipo = tipo;
      if (periodo) where.periodo = periodo;
      if (ativo_id) where.ativo_id = ativo_id;
      if (setor_id) where.setor_id = setor_id;
      if (user_id) where.user_id = user_id;
      if (categoria) where.categoria = categoria;
      
      if (data_inicio || data_fim) {
        where.data_inicio = {};
        if (data_inicio) where.data_inicio[Op.gte] = data_inicio;
        if (data_fim) where.data_fim = { [Op.lte]: data_fim };
      }

      const metricas = await Metrica.findAndCountAll({
        where,
        include: [
          { model: require('../models/Ativo'), as: 'ativo', attributes: ['id', 'nome', 'codigo'] },
          { model: require('../models/Setor'), as: 'setor', attributes: ['id', 'nome'] },
          { model: require('../models/User'), as: 'usuario', attributes: ['id', 'nome'] }
        ],
        order: [['data_inicio', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      res.json({
        success: true,
        data: metricas.rows,
        pagination: {
          total: metricas.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(metricas.count / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao listar métricas',
        error: error.message
      });
    }
  }

  // Obter KPIs principais
  async obterKPIs(req, res) {
    try {
      const { periodo = 'mensal' } = req.query;
      
      const kpis = await Metrica.getKPIsPrincipais();
      
      // Calcular tendências
      const kpisComTendencia = await Promise.all(kpis.map(async (kpi) => {
        const historico = await Metrica.getMetricasPorPeriodo(
          kpi.tipo, 
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 dias atrás
          new Date()
        );
        
        // Calcular tendência simples
        if (historico.length >= 2) {
          const valores = historico.map(h => parseFloat(h.valor));
          const ultimoValor = valores[valores.length - 1];
          const penultimoValor = valores[valores.length - 2];
          
          if (ultimoValor > penultimoValor * 1.05) {
            kpi.tendencia = 'crescente';
          } else if (ultimoValor < penultimoValor * 0.95) {
            kpi.tendencia = 'decrescente';
          } else {
            kpi.tendencia = 'estavel';
          }
        }
        
        return kpi;
      }));

      res.json({
        success: true,
        data: kpisComTendencia
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter KPIs',
        error: error.message
      });
    }
  }

  // Criar métrica
  async criarMetrica(req, res) {
    try {
      const metrica = await Metrica.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Métrica criada com sucesso',
        data: metrica
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao criar métrica',
        error: error.message
      });
    }
  }

  // Estatísticas gerais
  async obterEstatisticasGerais(req, res) {
    try {
      const { periodo = 30 } = req.query;
      const dataLimite = new Date(Date.now() - periodo * 24 * 60 * 60 * 1000);

      const [estatisticas] = await sequelize.query(`
        SELECT 
          COUNT(DISTINCT m.tipo) as tipos_metricas,
          COUNT(*) as total_metricas,
          AVG(m.valor) as valor_medio_metricas,
          COUNT(DISTINCT m.ativo_id) as ativos_monitorados,
          COUNT(DISTINCT m.setor_id) as setores_monitorados,
          COUNT(DISTINCT m.user_id) as usuarios_envolvidos,
          COUNT(CASE WHEN m.status_meta = 'atingiu' THEN 1 END) as metas_atingidas,
          COUNT(CASE WHEN m.status_meta = 'superou' THEN 1 END) as metas_superadas,
          COUNT(CASE WHEN m.meta IS NOT NULL THEN 1 END) as metricas_com_meta
        FROM metricas m 
        WHERE m.created_at >= :data_limite 
        AND m.ativo = 1
      `, {
        replacements: { data_limite: dataLimite },
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: estatisticas[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas gerais',
        error: error.message
      });
    }
  }

  // ==================== DASHBOARDS ====================

  // Listar dashboards
  async listarDashboards(req, res) {
    try {
      const { tipo, publico } = req.query;
      const userId = req.user.id;

      let dashboards;
      
      if (publico === 'true') {
        dashboards = await Dashboard.getDashboardsPublicos();
      } else {
        dashboards = await Dashboard.getDashboardsDoUsuario(userId);
      }

      if (tipo) {
        dashboards = dashboards.filter(d => d.tipo === tipo);
      }

      res.json({
        success: true,
        data: dashboards
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao listar dashboards',
        error: error.message
      });
    }
  }

  // Criar dashboard
  async criarDashboard(req, res) {
    try {
      const dashboardData = {
        ...req.body,
        user_id: req.user.id
      };

      const dashboard = await Dashboard.create(dashboardData);
      
      res.status(201).json({
        success: true,
        message: 'Dashboard criado com sucesso',
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao criar dashboard',
        error: error.message
      });
    }
  }

  // Obter dashboard por ID
  async obterDashboard(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const dashboard = await Dashboard.findOne({
        where: {
          id,
          [Op.or]: [
            { user_id: userId },
            { publico: true },
            {
              compartilhado_com: {
                [Op.contains]: userId
              }
            }
          ]
        },
        include: [{
          model: require('../models/User'),
          as: 'proprietario',
          attributes: ['id', 'nome', 'email']
        }]
      });

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard não encontrado'
        });
      }

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter dashboard',
        error: error.message
      });
    }
  }

  // Atualizar dashboard
  async atualizarDashboard(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const dashboard = await Dashboard.findOne({
        where: { id, user_id: userId }
      });

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard não encontrado ou sem permissão'
        });
      }

      // Fazer backup antes de atualizar
      await dashboard.fazerBackup();

      await dashboard.update(req.body);

      res.json({
        success: true,
        message: 'Dashboard atualizado com sucesso',
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar dashboard',
        error: error.message
      });
    }
  }

  // ==================== RELATÓRIOS ====================

  // Listar relatórios
  async listarRelatorios(req, res) {
    try {
      const { tipo, categoria, template, publico } = req.query;
      const userId = req.user.id;

      let relatorios;
      
      if (publico === 'true') {
        relatorios = await Relatorio.getRelatoriosPublicos();
      } else if (template === 'true') {
        relatorios = await Relatorio.getTemplates();
      } else {
        relatorios = await Relatorio.getRelatoriosDoUsuario(userId);
      }

      // Aplicar filtros
      if (tipo) {
        relatorios = relatorios.filter(r => r.tipo === tipo);
      }
      if (categoria) {
        relatorios = relatorios.filter(r => r.categoria === categoria);
      }

      res.json({
        success: true,
        data: relatorios
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao listar relatórios',
        error: error.message
      });
    }
  }

  // Criar relatório
  async criarRelatorio(req, res) {
    try {
      const relatorioData = {
        ...req.body,
        user_id: req.user.id,
        formato_saida: req.body.formato_saida || ['html', 'pdf', 'excel']
      };

      const relatorio = await Relatorio.create(relatorioData);
      
      res.status(201).json({
        success: true,
        message: 'Relatório criado com sucesso',
        data: relatorio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao criar relatório',
        error: error.message
      });
    }
  }

  // Executar relatório
  async executarRelatorio(req, res) {
    try {
      const { id } = req.params;
      const { formato = 'html', ...parametros } = req.body;
      const userId = req.user.id;

      // Verificar acesso ao relatório
      const relatorio = await Relatorio.findOne({
        where: {
          id,
          [Op.or]: [
            { user_id: userId },
            { publico: true },
            {
              compartilhado_com: {
                [Op.contains]: userId
              }
            }
          ]
        }
      });

      if (!relatorio) {
        return res.status(404).json({
          success: false,
          message: 'Relatório não encontrado'
        });
      }

      // Criar registro de execução
      const execucao = await RelatorioExecucao.create({
        relatorio_id: id,
        user_id: userId,
        parametros_utilizados: parametros,
        formato_exportacao: formato,
        ip_origem: req.ip,
        user_agent: req.get('User-Agent')
      });

      try {
        // Executar relatório
        const resultado = await relatorio.executar(parametros);
        
        // Marcar como concluído
        await execucao.marcarComoConcluido(resultado);

        res.json({
          success: true,
          message: 'Relatório executado com sucesso',
          data: {
            execucao_id: execucao.id,
            resultado: resultado,
            tempo_execucao: execucao.tempo_execucao,
            registros: execucao.registros_retornados
          }
        });
      } catch (execError) {
        // Marcar como erro
        await execucao.marcarComoErro(execError);
        throw execError;
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao executar relatório',
        error: error.message
      });
    }
  }

  // Obter execuções de relatório
  async obterExecucoesRelatorio(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const execucoes = await RelatorioExecucao.findAndCountAll({
        where: { relatorio_id: id },
        include: [{
          model: require('../models/User'),
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        }],
        order: [['inicio_execucao', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      res.json({
        success: true,
        data: execucoes.rows,
        pagination: {
          total: execucoes.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(execucoes.count / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter execuções do relatório',
        error: error.message
      });
    }
  }

  // Dashboard de Analytics
  async obterDashboardAnalytics(req, res) {
    try {
      const { periodo = 30 } = req.query;
      const dataLimite = new Date(Date.now() - periodo * 24 * 60 * 60 * 1000);

      // Estatísticas de relatórios
      const [statsRelatorios] = await sequelize.query(`
        SELECT 
          COUNT(DISTINCT r.id) as total_relatorios,
          COUNT(re.id) as total_execucoes,
          AVG(re.tempo_execucao) as tempo_medio_execucao,
          COUNT(CASE WHEN re.status = 'concluido' THEN 1 END) as execucoes_sucesso,
          COUNT(CASE WHEN re.status = 'erro' THEN 1 END) as execucoes_erro
        FROM relatorios r
        LEFT JOIN relatorio_execucoes re ON r.id = re.relatorio_id 
        WHERE re.inicio_execucao >= :data_limite OR re.inicio_execucao IS NULL
      `, {
        replacements: { data_limite: dataLimite },
        type: sequelize.QueryTypes.SELECT
      });

      // Relatórios mais executados
      const relatoriosMaisExecutados = await Relatorio.getMaisExecutados(5);

      // Execuções recentes
      const execucoesRecentes = await RelatorioExecucao.getExecucoesRecentes(10);

      res.json({
        success: true,
        data: {
          estatisticas: statsRelatorios[0],
          relatorios_mais_executados: relatoriosMaisExecutados,
          execucoes_recentes: execucoesRecentes
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter dashboard de analytics',
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();