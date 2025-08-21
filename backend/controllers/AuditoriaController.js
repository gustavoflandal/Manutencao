const { LogOperacao, User } = require('../models');
const AuditoriaService = require('../services/AuditoriaService');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class AuditoriaController {
  /**
   * Listar logs de auditoria com filtros
   */
  async index(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        usuario_id,
        modulo,
        operacao,
        nivel_risco,
        data_inicio,
        data_fim,
        sucesso,
        search,
        orderBy = 'data_operacao',
        orderDirection = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      // Aplicar filtros
      if (usuario_id) whereClause.usuario_id = usuario_id;
      if (modulo) whereClause.modulo = modulo;
      if (operacao) whereClause.operacao = operacao;
      if (nivel_risco) whereClause.nivel_risco = nivel_risco;
      if (sucesso !== undefined) whereClause.sucesso = sucesso === 'true';

      // Filtro de data
      if (data_inicio || data_fim) {
        whereClause.data_operacao = {};
        if (data_inicio) whereClause.data_operacao[Op.gte] = new Date(data_inicio);
        if (data_fim) whereClause.data_operacao[Op.lte] = new Date(data_fim);
      }

      // Busca textual
      if (search) {
        whereClause[Op.or] = [
          { descricao: { [Op.like]: `%${search}%` } },
          { usuario_nome: { [Op.like]: `%${search}%` } },
          { usuario_email: { [Op.like]: `%${search}%` } },
          { recurso_codigo: { [Op.like]: `%${search}%` } },
          { observacoes: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: logs } = await LogOperacao.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'nome', 'email'],
            required: false
          }
        ],
        order: [[orderBy, orderDirection.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      // Registrar visualização dos logs
      await AuditoriaService.registrarVisualizacao(
        AuditoriaService.modulos.SISTEMA,
        { id: 'logs-auditoria' },
        req.user,
        req,
        `Visualização de logs de auditoria - Página ${page}`
      );

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao listar logs de auditoria:', error);
      next(error);
    }
  }

  /**
   * Buscar log específico por ID
   */
  async show(req, res, next) {
    try {
      const { id } = req.params;

      const log = await LogOperacao.findByPk(id, {
        include: [
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'nome', 'email']
          }
        ]
      });

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Log de auditoria não encontrado'
        });
      }

      // Registrar acesso ao log específico
      await AuditoriaService.registrarVisualizacao(
        AuditoriaService.modulos.SISTEMA,
        { id: `log-${id}` },
        req.user,
        req,
        `Visualização detalhada do log ${id}`
      );

      res.json({
        success: true,
        data: { log }
      });

    } catch (error) {
      logger.error('Erro ao buscar log de auditoria:', error);
      next(error);
    }
  }

  /**
   * Estatísticas de auditoria
   */
  async estatisticas(req, res, next) {
    try {
      const { data_inicio, data_fim } = req.query;

      const dataInicio = data_inicio ? new Date(data_inicio) : null;
      const dataFim = data_fim ? new Date(data_fim) : null;

      const estatisticas = await AuditoriaService.obterEstatisticas(dataInicio, dataFim);

      // Dados adicionais
      const [
        logsMaisRecentes,
        operacoesCriticas,
        usuariosMaisAtivos,
        ipsFrequentes
      ] = await Promise.all([
        // Logs mais recentes
        LogOperacao.findAll({
          limit: 10,
          order: [['data_operacao', 'DESC']],
          include: [{ model: User, as: 'usuario', attributes: ['nome', 'email'] }]
        }),
        
        // Operações críticas recentes
        LogOperacao.findAll({
          where: { nivel_risco: ['ALTO', 'CRITICO'] },
          limit: 10,
          order: [['data_operacao', 'DESC']],
          include: [{ model: User, as: 'usuario', attributes: ['nome', 'email'] }]
        }),
        
        // Usuários mais ativos
        LogOperacao.findAll({
          attributes: [
            'usuario_id',
            'usuario_nome',
            'usuario_email',
            [require('sequelize').fn('COUNT', '*'), 'total_operacoes']
          ],
          where: dataInicio || dataFim ? {
            data_operacao: {
              ...(dataInicio && { [Op.gte]: dataInicio }),
              ...(dataFim && { [Op.lte]: dataFim })
            }
          } : {},
          group: ['usuario_id', 'usuario_nome', 'usuario_email'],
          order: [[require('sequelize').literal('total_operacoes'), 'DESC']],
          limit: 10
        }),
        
        // IPs mais frequentes
        LogOperacao.findAll({
          attributes: [
            'ip_address',
            [require('sequelize').fn('COUNT', '*'), 'total_acessos']
          ],
          where: {
            ip_address: { [Op.ne]: null },
            ...(dataInicio || dataFim ? {
              data_operacao: {
                ...(dataInicio && { [Op.gte]: dataInicio }),
                ...(dataFim && { [Op.lte]: dataFim })
              }
            } : {})
          },
          group: ['ip_address'],
          order: [[require('sequelize').literal('total_acessos'), 'DESC']],
          limit: 10
        })
      ]);

      // Registrar visualização das estatísticas
      await AuditoriaService.registrarVisualizacao(
        AuditoriaService.modulos.SISTEMA,
        { id: 'estatisticas-auditoria' },
        req.user,
        req,
        'Visualização de estatísticas de auditoria'
      );

      res.json({
        success: true,
        data: {
          ...estatisticas,
          logsMaisRecentes,
          operacoesCriticas,
          usuariosMaisAtivos: usuariosMaisAtivos.map(u => ({
            usuario_id: u.usuario_id,
            usuario_nome: u.usuario_nome,
            usuario_email: u.usuario_email,
            total_operacoes: u.dataValues.total_operacoes
          })),
          ipsFrequentes: ipsFrequentes.map(ip => ({
            ip_address: ip.ip_address,
            total_acessos: ip.dataValues.total_acessos
          }))
        }
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas de auditoria:', error);
      next(error);
    }
  }

  /**
   * Relatório de auditoria
   */
  async relatorio(req, res, next) {
    try {
      const filtros = {
        dataInicio: req.query.data_inicio ? new Date(req.query.data_inicio) : null,
        dataFim: req.query.data_fim ? new Date(req.query.data_fim) : null,
        usuario_id: req.query.usuario_id,
        modulo: req.query.modulo,
        operacao: req.query.operacao,
        nivel_risco: req.query.nivel_risco,
        limite: parseInt(req.query.limite) || 1000
      };

      const logs = await AuditoriaService.gerarRelatorioAuditoria(filtros);

      // Registrar geração do relatório
      await AuditoriaService.registrarOperacao({
        operacao: AuditoriaService.operacoes.EXPORT,
        modulo: AuditoriaService.modulos.SISTEMA,
        descricao: `Geração de relatório de auditoria com ${logs.length} registros`,
        usuario: req.user,
        req,
        nivelRisco: AuditoriaService.nivelRisco.MEDIO,
        observacoes: `Filtros aplicados: ${JSON.stringify(filtros)}`
      });

      res.json({
        success: true,
        data: {
          logs,
          filtros,
          total: logs.length,
          gerado_em: new Date(),
          gerado_por: req.user?.nome
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de auditoria:', error);
      next(error);
    }
  }

  /**
   * Logs por usuário específico
   */
  async logsPorUsuario(req, res, next) {
    try {
      const { usuarioId } = req.params;
      const { limite = 100 } = req.query;

      const logs = await AuditoriaService.buscarLogs('usuario_id', usuarioId, parseInt(limite));

      const usuario = await User.findByPk(usuarioId, {
        attributes: ['id', 'nome', 'email']
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Registrar consulta
      await AuditoriaService.registrarVisualizacao(
        AuditoriaService.modulos.USUARIOS,
        usuario,
        req.user,
        req,
        `Consulta de logs do usuário ${usuario.nome}`
      );

      res.json({
        success: true,
        data: {
          usuario,
          logs,
          total: logs.length
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar logs por usuário:', error);
      next(error);
    }
  }

  /**
   * Logs por módulo
   */
  async logsPorModulo(req, res, next) {
    try {
      const { modulo } = req.params;
      const { limite = 100 } = req.query;

      const logs = await AuditoriaService.buscarLogs('modulo', modulo.toUpperCase(), parseInt(limite));

      // Registrar consulta
      await AuditoriaService.registrarVisualizacao(
        AuditoriaService.modulos.SISTEMA,
        { id: `logs-modulo-${modulo}` },
        req.user,
        req,
        `Consulta de logs do módulo ${modulo}`
      );

      res.json({
        success: true,
        data: {
          modulo: modulo.toUpperCase(),
          logs,
          total: logs.length
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar logs por módulo:', error);
      next(error);
    }
  }

  /**
   * Operações críticas
   */
  async operacoesCriticas(req, res, next) {
    try {
      const { limite = 50 } = req.query;

      const operacoes = await LogOperacao.findAll({
        where: {
          nivel_risco: ['ALTO', 'CRITICO']
        },
        include: [
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'nome', 'email']
          }
        ],
        order: [['data_operacao', 'DESC']],
        limit: parseInt(limite)
      });

      // Registrar consulta
      await AuditoriaService.registrarVisualizacao(
        AuditoriaService.modulos.SISTEMA,
        { id: 'operacoes-criticas' },
        req.user,
        req,
        'Consulta de operações críticas'
      );

      res.json({
        success: true,
        data: {
          operacoes,
          total: operacoes.length
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar operações críticas:', error);
      next(error);
    }
  }

  /**
   * Buscar logs por período
   */
  async logsPorPeriodo(req, res, next) {
    try {
      const { data_inicio, data_fim } = req.query;

      if (!data_inicio || !data_fim) {
        return res.status(400).json({
          success: false,
          message: 'Data de início e fim são obrigatórias'
        });
      }

      const logs = await LogOperacao.findAll({
        where: {
          data_operacao: {
            [Op.between]: [new Date(data_inicio), new Date(data_fim)]
          }
        },
        include: [
          {
            model: User,
            as: 'usuario',
            attributes: ['id', 'nome', 'email']
          }
        ],
        order: [['data_operacao', 'DESC']]
      });

      // Agrupar por dia
      const logsPorDia = logs.reduce((acc, log) => {
        const dia = log.data_operacao.toISOString().split('T')[0];
        if (!acc[dia]) acc[dia] = [];
        acc[dia].push(log);
        return acc;
      }, {});

      // Registrar consulta
      await AuditoriaService.registrarVisualizacao(
        AuditoriaService.modulos.SISTEMA,
        { id: 'logs-periodo' },
        req.user,
        req,
        `Consulta de logs período ${data_inicio} a ${data_fim}`
      );

      res.json({
        success: true,
        data: {
          logs,
          logsPorDia,
          periodo: { data_inicio, data_fim },
          total: logs.length
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar logs por período:', error);
      next(error);
    }
  }
}

module.exports = new AuditoriaController();