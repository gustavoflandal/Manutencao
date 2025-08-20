const { OrdemServico, Ativo, User, Solicitacao, Setor } = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');

const OrdemServicoController = {
  // Listar todas as ordens de serviço com filtros e paginação
  async index(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        tipo, 
        prioridade, 
        setor_id, 
        responsavel_id,
        data_inicio, 
        data_fim,
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};
      const include = [
        {
          model: Ativo,
          as: 'ativo',
          include: [{ model: Setor, as: 'setor' }]
        },
        {
          model: User,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: User,
          as: 'solicitante',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Solicitacao,
          as: 'solicitacao',
          required: false
        }
      ];

      // Filtros
      if (status) where.status = status;
      if (tipo) where.tipo = tipo;
      if (prioridade) where.prioridade = prioridade;
      if (responsavel_id) where.responsavel_id = responsavel_id;

      // Filtro por setor através do ativo
      if (setor_id) {
        include[0].where = { setor_id };
      }

      // Filtro por período
      if (data_inicio || data_fim) {
        where.data_inicio_prevista = {};
        if (data_inicio) where.data_inicio_prevista[Op.gte] = new Date(data_inicio);
        if (data_fim) where.data_inicio_prevista[Op.lte] = new Date(data_fim);
      }

      // Busca textual
      if (search) {
        where[Op.or] = [
          { numero_os: { [Op.like]: `%${search}%` } },
          { descricao_servico: { [Op.like]: `%${search}%` } },
          { observacoes_execucao: { [Op.like]: `%${search}%` } }
        ];
      }

      const result = await OrdemServico.findAndCountAll({
        where,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ['prioridade', 'DESC'],
          ['data_inicio_prevista', 'ASC'],
          ['created_at', 'DESC']
        ]
      });

      // Calcular estatísticas
      const stats = await this.getStatistics();

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: result.count,
          total_pages: Math.ceil(result.count / limit)
        },
        statistics: stats
      });

    } catch (error) {
      logger.error('Erro ao listar ordens de serviço:', error);
      next(error);
    }
  },

  // Buscar ordem de serviço específica
  async show(req, res, next) {
    try {
      const { id } = req.params;

      const os = await OrdemServico.findByPk(id, {
        include: [
          {
            model: Ativo,
            as: 'ativo',
            include: [{ model: Setor, as: 'setor' }]
          },
          {
            model: User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email', 'perfil']
          },
          {
            model: User,
            as: 'solicitante',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Solicitacao,
            as: 'solicitacao',
            required: false
          }
        ]
      });

      if (!os) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      res.json({
        success: true,
        data: os
      });

    } catch (error) {
      logger.error('Erro ao buscar ordem de serviço:', error);
      next(error);
    }
  },

  // Criar nova ordem de serviço
  async create(req, res, next) {
    try {
      const {
        ativo_id,
        solicitacao_id,
        tipo,
        prioridade = 'normal',
        descricao_servico,
        data_inicio_prevista,
        data_fim_prevista,
        horas_planejadas,
        responsavel_id,
        observacoes
      } = req.body;

      // Validações
      if (!ativo_id) {
        return res.status(400).json({
          success: false,
          message: 'Ativo é obrigatório'
        });
      }

      if (!tipo) {
        return res.status(400).json({
          success: false,
          message: 'Tipo da OS é obrigatório'
        });
      }

      // Verificar se o ativo existe
      const ativo = await Ativo.findByPk(ativo_id);
      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Verificar se o responsável existe (se informado)
      if (responsavel_id) {
        const responsavel = await User.findByPk(responsavel_id);
        if (!responsavel) {
          return res.status(404).json({
            success: false,
            message: 'Responsável não encontrado'
          });
        }
      }

      const os = await OrdemServico.create({
        ativo_id,
        solicitacao_id,
        solicitante_id: req.user.id,
        responsavel_id,
        tipo,
        prioridade,
        descricao_servico,
        data_inicio_prevista,
        data_fim_prevista,
        horas_planejadas,
        observacoes_execucao: observacoes,
        status: 'planejada'
      });

      // Buscar a OS criada com todos os relacionamentos
      const osCompleta = await OrdemServico.findByPk(os.id, {
        include: [
          { model: Ativo, as: 'ativo' },
          { model: User, as: 'responsavel', attributes: ['id', 'nome', 'email'] },
          { model: User, as: 'solicitante', attributes: ['id', 'nome', 'email'] }
        ]
      });

      logger.info(`OS ${os.numero_os} criada`, {
        os_id: os.id,
        ativo_id,
        solicitante_id: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Ordem de serviço criada com sucesso',
        data: osCompleta
      });

    } catch (error) {
      logger.error('Erro ao criar ordem de serviço:', error);
      next(error);
    }
  },

  // Atualizar ordem de serviço
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        responsavel_id,
        tipo,
        prioridade,
        descricao_servico,
        data_inicio_prevista,
        data_fim_prevista,
        horas_planejadas,
        observacoes_execucao
      } = req.body;

      const os = await OrdemServico.findByPk(id);
      if (!os) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Verificar permissões (apenas responsável, supervisor ou admin pode editar)
      const canEdit = req.user.perfil === 'administrador' || 
                      req.user.perfil === 'supervisor' ||
                      os.responsavel_id === req.user.id ||
                      os.solicitante_id === req.user.id;

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para editar esta OS'
        });
      }

      await os.update({
        responsavel_id,
        tipo,
        prioridade,
        descricao_servico,
        data_inicio_prevista,
        data_fim_prevista,
        horas_planejadas,
        observacoes_execucao
      });

      const osAtualizada = await OrdemServico.findByPk(id, {
        include: [
          { model: Ativo, as: 'ativo' },
          { model: User, as: 'responsavel', attributes: ['id', 'nome', 'email'] },
          { model: User, as: 'solicitante', attributes: ['id', 'nome', 'email'] }
        ]
      });

      logger.info(`OS ${os.numero_os} atualizada`, {
        os_id: id,
        user_id: req.user.id
      });

      res.json({
        success: true,
        message: 'Ordem de serviço atualizada com sucesso',
        data: osAtualizada
      });

    } catch (error) {
      logger.error('Erro ao atualizar ordem de serviço:', error);
      next(error);
    }
  },

  // Alterar status da OS
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, data_inicio_real, data_fim_real, horas_realizadas } = req.body;

      const os = await OrdemServico.findByPk(id);
      if (!os) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Validar transições de status
      const statusValidos = ['planejada', 'em_execucao', 'pausada', 'concluida', 'cancelada'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
      }

      // Regras de transição
      const transicoesValidas = {
        'planejada': ['em_execucao', 'cancelada'],
        'em_execucao': ['pausada', 'concluida', 'cancelada'],
        'pausada': ['em_execucao', 'concluida', 'cancelada'],
        'concluida': [], // Não pode sair do status concluída
        'cancelada': ['planejada'] // Pode reabrir uma OS cancelada
      };

      if (!transicoesValidas[os.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Transição de ${os.status} para ${status} não permitida`
        });
      }

      const updateData = { status };

      // Controle automático de datas baseado no status
      if (status === 'em_execucao' && !os.data_inicio_real) {
        updateData.data_inicio_real = new Date();
      }

      if (status === 'concluida') {
        updateData.data_fim_real = data_fim_real || new Date();
        if (horas_realizadas) {
          updateData.horas_realizadas = horas_realizadas;
        }
      }

      await os.update(updateData);

      logger.info(`Status da OS ${os.numero_os} alterado para ${status}`, {
        os_id: id,
        old_status: os.status,
        new_status: status,
        user_id: req.user.id
      });

      res.json({
        success: true,
        message: `Status alterado para ${status}`,
        data: { id, status, ...updateData }
      });

    } catch (error) {
      logger.error('Erro ao alterar status da OS:', error);
      next(error);
    }
  },

  // Deletar ordem de serviço
  async destroy(req, res, next) {
    try {
      const { id } = req.params;

      const os = await OrdemServico.findByPk(id);
      if (!os) {
        return res.status(404).json({
          success: false,
          message: 'Ordem de serviço não encontrada'
        });
      }

      // Apenas admin ou supervisor pode deletar
      if (!['administrador', 'supervisor'].includes(req.user.perfil)) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para deletar OS'
        });
      }

      // Não permitir deletar OS concluídas
      if (os.status === 'concluida') {
        return res.status(400).json({
          success: false,
          message: 'Não é possível deletar OS concluída'
        });
      }

      await os.destroy();

      logger.info(`OS ${os.numero_os} deletada`, {
        os_id: id,
        user_id: req.user.id
      });

      res.json({
        success: true,
        message: 'Ordem de serviço deletada com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao deletar ordem de serviço:', error);
      next(error);
    }
  },

  // Obter estatísticas das OS
  async getStatistics() {
    try {
      const [
        total,
        planejadas,
        emExecucao,
        pausadas,
        concluidas,
        canceladas,
        criticas,
        altas,
        osAtrasadas
      ] = await Promise.all([
        OrdemServico.count(),
        OrdemServico.count({ where: { status: 'planejada' } }),
        OrdemServico.count({ where: { status: 'em_execucao' } }),
        OrdemServico.count({ where: { status: 'pausada' } }),
        OrdemServico.count({ where: { status: 'concluida' } }),
        OrdemServico.count({ where: { status: 'cancelada' } }),
        OrdemServico.count({ where: { prioridade: 'critica' } }),
        OrdemServico.count({ where: { prioridade: 'alta' } }),
        OrdemServico.count({
          where: {
            status: { [Op.in]: ['planejada', 'em_execucao', 'pausada'] },
            data_fim_prevista: { [Op.lt]: new Date() }
          }
        })
      ]);

      return {
        total,
        por_status: {
          planejadas,
          em_execucao: emExecucao,
          pausadas,
          concluidas,
          canceladas
        },
        por_prioridade: {
          criticas,
          altas
        },
        atrasadas: osAtrasadas
      };

    } catch (error) {
      logger.error('Erro ao calcular estatísticas:', error);
      return {};
    }
  },

  // Relatório de produtividade
  async relatorioprodutividade(req, res, next) {
    try {
      const { data_inicio, data_fim, responsavel_id, setor_id } = req.query;

      const where = {
        status: 'concluida'
      };

      if (data_inicio || data_fim) {
        where.data_fim_real = {};
        if (data_inicio) where.data_fim_real[Op.gte] = new Date(data_inicio);
        if (data_fim) where.data_fim_real[Op.lte] = new Date(data_fim);
      }

      if (responsavel_id) {
        where.responsavel_id = responsavel_id;
      }

      const include = [
        { model: Ativo, as: 'ativo' },
        { model: User, as: 'responsavel', attributes: ['id', 'nome'] }
      ];

      if (setor_id) {
        include[0].where = { setor_id };
      }

      const ossConcluidas = await OrdemServico.findAll({
        where,
        include,
        order: [['data_fim_real', 'DESC']]
      });

      // Calcular métricas
      const totalOS = ossConcluidas.length;
      const totalHorasRealizadas = ossConcluidas.reduce((acc, os) => acc + parseFloat(os.horas_realizadas || 0), 0);
      const totalCustos = ossConcluidas.reduce((acc, os) => acc + parseFloat(os.custo_total || 0), 0);
      
      const mediaHorasPorOS = totalOS > 0 ? totalHorasRealizadas / totalOS : 0;
      const mediaCustoPorOS = totalOS > 0 ? totalCustos / totalOS : 0;

      // Agrupar por responsável
      const porResponsavel = {};
      ossConcluidas.forEach(os => {
        if (os.responsavel) {
          const nome = os.responsavel.nome;
          if (!porResponsavel[nome]) {
            porResponsavel[nome] = {
              total_os: 0,
              total_horas: 0,
              total_custos: 0
            };
          }
          porResponsavel[nome].total_os++;
          porResponsavel[nome].total_horas += parseFloat(os.horas_realizadas || 0);
          porResponsavel[nome].total_custos += parseFloat(os.custo_total || 0);
        }
      });

      res.json({
        success: true,
        data: {
          resumo: {
            total_os: totalOS,
            total_horas: totalHorasRealizadas,
            total_custos: totalCustos,
            media_horas_por_os: mediaHorasPorOS,
            media_custo_por_os: mediaCustoPorOS
          },
          por_responsavel: porResponsavel,
          detalhes: ossConcluidas
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de produtividade:', error);
      next(error);
    }
  }
};

module.exports = OrdemServicoController;