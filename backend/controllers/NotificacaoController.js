const { Notificacao, ConfiguracaoNotificacao, User } = require('../models');
const { Op } = require('sequelize');

class NotificacaoController {
  // Listar notificações do usuário
  async listar(req, res) {
    try {
      const { page = 1, limit = 20, tipo, prioridade, lida, setor } = req.query;
      const offset = (page - 1) * limit;
      const userId = req.user.id;

      const whereConditions = {
        [Op.or]: [
          { user_id: userId },
          { user_id: null } // Notificações globais
        ]
      };

      // Filtros opcionais
      if (tipo) {
        whereConditions.tipo = tipo;
      }

      if (prioridade) {
        whereConditions.prioridade = prioridade;
      }

      if (lida !== undefined) {
        whereConditions.lida = lida === 'true';
      }

      if (setor) {
        whereConditions.setor_id = setor;
      }

      // Excluir notificações expiradas
      whereConditions[Op.or].push({
        data_expiracao: {
          [Op.or]: [
            { [Op.is]: null },
            { [Op.gt]: new Date() }
          ]
        }
      });

      const { count, rows: notificacoes } = await Notificacao.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'remetente',
            attributes: ['id', 'nome']
          }
        ],
        order: [
          ['lida', 'ASC'],
          ['prioridade', 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Marcar notificações como entregues
      await Notificacao.update(
        { entregue: true, data_entrega: new Date() },
        {
          where: {
            id: { [Op.in]: notificacoes.map(n => n.id) },
            entregue: false
          }
        }
      );

      res.json({
        notificacoes,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Obter uma notificação específica
  async obter(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notificacao = await Notificacao.findOne({
        where: {
          id,
          [Op.or]: [
            { user_id: userId },
            { user_id: null }
          ]
        },
        include: [
          {
            model: User,
            as: 'remetente',
            attributes: ['id', 'nome']
          }
        ]
      });

      if (!notificacao) {
        return res.status(404).json({ message: 'Notificação não encontrada' });
      }

      // Marcar como lida se ainda não foi
      if (!notificacao.lida) {
        await notificacao.update({
          lida: true,
          data_leitura: new Date()
        });
      }

      res.json(notificacao);
    } catch (error) {
      console.error('Erro ao obter notificação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Criar nova notificação
  async criar(req, res) {
    try {
      const {
        tipo,
        titulo,
        mensagem,
        prioridade = 'normal',
        user_id,
        link,
        setor_id,
        categoria,
        metadata,
        data_expiracao,
        enviar_email = false
      } = req.body;

      const remetente_id = req.user.id;

      // Validações básicas
      if (!tipo || !titulo || !mensagem) {
        return res.status(400).json({
          message: 'Tipo, título e mensagem são obrigatórios'
        });
      }

      const notificacao = await Notificacao.create({
        tipo,
        titulo,
        mensagem,
        prioridade,
        user_id,
        remetente_id,
        link,
        setor_id,
        categoria,
        metadata,
        data_expiracao,
        enviar_email
      });

      // Buscar usuários que devem receber a notificação
      if (!user_id) {
        // Notificação global - enviar para usuários com configuração apropriada
        const usuariosParaNotificar = await ConfiguracaoNotificacao.obterUsuariosParaNotificacao(
          tipo,
          prioridade,
          setor_id
        );

        for (const { user, deve_receber_email } of usuariosParaNotificar) {
          await Notificacao.create({
            ...notificacao.toJSON(),
            id: undefined,
            user_id: user.id,
            enviar_email: deve_receber_email
          });
        }
      }

      const notificacaoCompleta = await Notificacao.findByPk(notificacao.id, {
        include: [
          {
            model: User,
            as: 'remetente',
            attributes: ['id', 'nome']
          }
        ]
      });

      res.status(201).json(notificacaoCompleta);
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Marcar notificação como lida
  async marcarLida(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notificacao = await Notificacao.findOne({
        where: {
          id,
          [Op.or]: [
            { user_id: userId },
            { user_id: null }
          ]
        }
      });

      if (!notificacao) {
        return res.status(404).json({ message: 'Notificação não encontrada' });
      }

      if (!notificacao.lida) {
        await notificacao.update({
          lida: true,
          data_leitura: new Date()
        });
      }

      res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Marcar múltiplas notificações como lidas
  async marcarVariasLidas(req, res) {
    try {
      const { ids } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Array de IDs é obrigatório' });
      }

      const resultado = await Notificacao.update(
        {
          lida: true,
          data_leitura: new Date()
        },
        {
          where: {
            id: { [Op.in]: ids },
            [Op.or]: [
              { user_id: userId },
              { user_id: null }
            ],
            lida: false
          }
        }
      );

      res.json({ 
        message: `${resultado[0]} notificações marcadas como lidas`,
        atualizadas: resultado[0]
      });
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Marcar todas as notificações como lidas
  async marcarTodasLidas(req, res) {
    try {
      const userId = req.user.id;

      const resultado = await Notificacao.update(
        {
          lida: true,
          data_leitura: new Date()
        },
        {
          where: {
            [Op.or]: [
              { user_id: userId },
              { user_id: null }
            ],
            lida: false
          }
        }
      );

      res.json({ 
        message: `${resultado[0]} notificações marcadas como lidas`,
        atualizadas: resultado[0]
      });
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Deletar notificação
  async deletar(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notificacao = await Notificacao.findOne({
        where: {
          id,
          [Op.or]: [
            { user_id: userId },
            { user_id: null }
          ]
        }
      });

      if (!notificacao) {
        return res.status(404).json({ message: 'Notificação não encontrada' });
      }

      await notificacao.destroy();

      res.json({ message: 'Notificação deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Contar notificações não lidas
  async contarNaoLidas(req, res) {
    try {
      const userId = req.user.id;

      const count = await Notificacao.count({
        where: {
          [Op.or]: [
            { user_id: userId },
            { user_id: null }
          ],
          lida: false,
          [Op.or]: [
            { data_expiracao: null },
            { data_expiracao: { [Op.gt]: new Date() } }
          ]
        }
      });

      res.json({ nao_lidas: count });
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Obter estatísticas de notificações
  async estatisticas(req, res) {
    try {
      const userId = req.user.id;
      const { periodo = 'mes' } = req.query;

      let dataInicio;
      const dataFim = new Date();

      switch (periodo) {
        case 'semana':
          dataInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'mes':
          dataInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'ano':
          dataInicio = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dataInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const whereBase = {
        [Op.or]: [
          { user_id: userId },
          { user_id: null }
        ],
        created_at: {
          [Op.between]: [dataInicio, dataFim]
        }
      };

      const [
        total,
        lidas,
        porTipo,
        porPrioridade,
        recentes
      ] = await Promise.all([
        Notificacao.count({ where: whereBase }),
        Notificacao.count({ where: { ...whereBase, lida: true } }),
        Notificacao.findAll({
          where: whereBase,
          attributes: [
            'tipo',
            [Notificacao.sequelize.fn('COUNT', Notificacao.sequelize.col('tipo')), 'count']
          ],
          group: ['tipo']
        }),
        Notificacao.findAll({
          where: whereBase,
          attributes: [
            'prioridade',
            [Notificacao.sequelize.fn('COUNT', Notificacao.sequelize.col('prioridade')), 'count']
          ],
          group: ['prioridade']
        }),
        Notificacao.findAll({
          where: whereBase,
          limit: 5,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: User,
              as: 'remetente',
              attributes: ['id', 'nome']
            }
          ]
        })
      ]);

      res.json({
        periodo,
        total,
        lidas,
        nao_lidas: total - lidas,
        taxa_leitura: total > 0 ? ((lidas / total) * 100).toFixed(1) : 0,
        por_tipo: porTipo.map(item => ({
          tipo: item.tipo,
          count: parseInt(item.dataValues.count)
        })),
        por_prioridade: porPrioridade.map(item => ({
          prioridade: item.prioridade,
          count: parseInt(item.dataValues.count)
        })),
        recentes
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Obter configurações de notificação do usuário
  async obterConfiguracoes(req, res) {
    try {
      const userId = req.user.id;

      const config = await ConfiguracaoNotificacao.obterPorUsuario(userId);

      res.json(config);
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Atualizar configurações de notificação do usuário
  async atualizarConfiguracoes(req, res) {
    try {
      const userId = req.user.id;
      const novasConfiguracoes = req.body;

      const config = await ConfiguracaoNotificacao.atualizarPorUsuario(
        userId,
        novasConfiguracoes
      );

      res.json({
        message: 'Configurações atualizadas com sucesso',
        configuracoes: config
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Pausar notificações temporariamente
  async pausarNotificacoes(req, res) {
    try {
      const userId = req.user.id;
      const { pausar_ate } = req.body;

      const config = await ConfiguracaoNotificacao.obterPorUsuario(userId);

      await config.update({
        pausar_notificacoes: true,
        pausar_ate: pausar_ate ? new Date(pausar_ate) : null
      });

      res.json({
        message: 'Notificações pausadas com sucesso',
        pausar_ate
      });
    } catch (error) {
      console.error('Erro ao pausar notificações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Reativar notificações
  async reativarNotificacoes(req, res) {
    try {
      const userId = req.user.id;

      const config = await ConfiguracaoNotificacao.obterPorUsuario(userId);

      await config.update({
        pausar_notificacoes: false,
        pausar_ate: null
      });

      res.json({ message: 'Notificações reativadas com sucesso' });
    } catch (error) {
      console.error('Erro ao reativar notificações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  // Teste de notificação (apenas para administradores)
  async testeNotificacao(req, res) {
    try {
      if (req.user.perfil !== 'administrador') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { user_id, tipo = 'sistema' } = req.body;

      const notificacao = await Notificacao.create({
        tipo,
        titulo: 'Teste de Notificação',
        mensagem: 'Esta é uma notificação de teste enviada pelo administrador.',
        prioridade: 'normal',
        user_id,
        remetente_id: req.user.id,
        categoria: 'teste'
      });

      res.json({
        message: 'Notificação de teste enviada com sucesso',
        notificacao
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}

module.exports = new NotificacaoController();