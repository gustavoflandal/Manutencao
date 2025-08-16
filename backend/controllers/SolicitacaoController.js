const { Solicitacao, User, Department, Category, SubCategory } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class SolicitacaoController {
  // Listar solicitações com paginação e filtros
  async index(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '', 
        categoria = '',
        prioridade = '',
        solicitante_id = '',
        responsavel_id = '',
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Construir filtros
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { numero: { [Op.like]: `%${search}%` } },
          { titulo: { [Op.like]: `%${search}%` } },
          { descricao: { [Op.like]: `%${search}%` } },
          { localizacao: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      if (categoria) {
        whereClause.categoria = categoria;
      }
      
      if (prioridade) {
        whereClause.prioridade = prioridade;
      }
      
      if (solicitante_id) {
        whereClause.solicitante_id = solicitante_id;
      }
      
      if (responsavel_id) {
        whereClause.responsavel_id = responsavel_id;
      }

      // Verificar permissões - solicitantes só veem suas próprias solicitações
      if (req.user.perfil === 'solicitante') {
        whereClause.solicitante_id = req.user.id;
      }

      // Buscar solicitações
      const { count, rows: solicitacoes } = await Solicitacao.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'solicitante',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email'],
            required: false
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'nome'],
            required: false
          },
          {
            model: Category,
            as: 'categoriaObj',
            attributes: ['id', 'nome', 'cor', 'icone'],
            required: false
          },
          {
            model: SubCategory,
            as: 'subcategoriaObj',
            attributes: ['id', 'nome'],
            required: false
          }
        ],
        order: [[orderBy, orderDirection.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          solicitacoes,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao listar solicitações:', error);
      next(error);
    }
  }

  // Buscar solicitação por ID
  async show(req, res, next) {
    try {
      const { id } = req.params;
      
      const solicitacao = await Solicitacao.findByPk(id, {
        include: [
          {
            model: User,
            as: 'solicitante',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email'],
            required: false
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'nome'],
            required: false
          },
          {
            model: Category,
            as: 'categoriaObj',
            attributes: ['id', 'nome', 'cor', 'icone'],
            required: false
          },
          {
            model: SubCategory,
            as: 'subcategoriaObj',
            attributes: ['id', 'nome'],
            required: false
          }
        ]
      });

      if (!solicitacao) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      // Verificar permissões - solicitantes só veem suas próprias solicitações
      if (req.user.perfil === 'solicitante' && solicitacao.solicitante_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para visualizar esta solicitação'
        });
      }

      res.json({
        success: true,
        data: { solicitacao }
      });

    } catch (error) {
      logger.error('Erro ao buscar solicitação:', error);
      next(error);
    }
  }

  // Criar nova solicitação
  async store(req, res, next) {
    try {
      const { 
        titulo, 
        descricao, 
        categoria, 
        subcategoria,
        prioridade, 
        localizacao, 
        observacoes,
        data_prevista,
        department_id
      } = req.body;

      // Validações básicas
      if (!titulo || !descricao || !categoria || !localizacao) {
        return res.status(400).json({
          success: false,
          message: 'Título, descrição, categoria e localização são obrigatórios'
        });
      }

      // Verificar se categoria é válida
      const categoriasValidas = ['predial', 'industrial', 'ti', 'infraestrutura'];
      if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({
          success: false,
          message: 'Categoria inválida'
        });
      }

      // Verificar se prioridade é válida (se fornecida)
      if (prioridade) {
        const prioridadesValidas = ['baixa', 'normal', 'alta', 'critica'];
        if (!prioridadesValidas.includes(prioridade)) {
          return res.status(400).json({
            success: false,
            message: 'Prioridade inválida'
          });
        }
      }

      // Criar solicitação
      const solicitacaoData = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria,
        subcategoria: subcategoria?.trim(),
        prioridade: prioridade || 'normal',
        localizacao: localizacao.trim(),
        observacoes: observacoes?.trim(),
        data_prevista: data_prevista || null,
        department_id: department_id || null,
        solicitante_id: req.user.id
      };

      const solicitacao = await Solicitacao.create(solicitacaoData);

      // Recarregar com associações
      const solicitacaoCompleta = await Solicitacao.findByPk(solicitacao.id, {
        include: [
          {
            model: User,
            as: 'solicitante',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'nome'],
            required: false
          },
          {
            model: Category,
            as: 'categoriaObj',
            attributes: ['id', 'nome', 'cor', 'icone'],
            required: false
          },
          {
            model: SubCategory,
            as: 'subcategoriaObj',
            attributes: ['id', 'nome'],
            required: false
          }
        ]
      });

      logger.info(`Solicitação criada: ${solicitacao.numero}`, {
        solicitacaoId: solicitacao.id,
        solicitanteId: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Solicitação criada com sucesso',
        data: { solicitacao: solicitacaoCompleta }
      });

    } catch (error) {
      logger.error('Erro ao criar solicitação:', error);
      next(error);
    }
  }

  // Atualizar solicitação
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        titulo, 
        descricao, 
        categoria, 
        subcategoria,
        prioridade, 
        localizacao, 
        observacoes,
        data_prevista,
        department_id,
        status,
        responsavel_id
      } = req.body;

      // Buscar solicitação
      const solicitacao = await Solicitacao.findByPk(id);
      
      if (!solicitacao) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      // Verificar permissões
      const canEdit = req.user.perfil === 'administrador' || 
                     req.user.perfil === 'supervisor' ||
                     (req.user.perfil === 'solicitante' && solicitacao.solicitante_id === req.user.id && solicitacao.status === 'aberta');

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para editar esta solicitação'
        });
      }

      // Campos que solicitantes podem editar (apenas se status for 'aberta')
      const updateData = {};
      if (titulo) updateData.titulo = titulo.trim();
      if (descricao) updateData.descricao = descricao.trim();
      if (categoria) updateData.categoria = categoria;
      if (subcategoria !== undefined) updateData.subcategoria = subcategoria?.trim();
      if (localizacao) updateData.localizacao = localizacao.trim();
      if (observacoes !== undefined) updateData.observacoes = observacoes?.trim();
      if (data_prevista !== undefined) updateData.data_prevista = data_prevista;
      if (department_id !== undefined) updateData.department_id = department_id;

      // Campos que apenas supervisores e admins podem editar
      if (req.user.perfil === 'supervisor' || req.user.perfil === 'administrador') {
        if (prioridade) updateData.prioridade = prioridade;
        if (status) updateData.status = status;
        if (responsavel_id !== undefined) updateData.responsavel_id = responsavel_id;
        
        // Se fechando a solicitação, definir data de fechamento
        if (status === 'fechada' && solicitacao.status !== 'fechada') {
          updateData.data_fechamento = new Date();
        }
        
        // Se reabrindo a solicitação, limpar data de fechamento
        if (status !== 'fechada' && solicitacao.status === 'fechada') {
          updateData.data_fechamento = null;
        }
      }

      await solicitacao.update(updateData);

      // Recarregar com associações
      const solicitacaoAtualizada = await Solicitacao.findByPk(id, {
        include: [
          {
            model: User,
            as: 'solicitante',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email'],
            required: false
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'nome'],
            required: false
          },
          {
            model: Category,
            as: 'categoriaObj',
            attributes: ['id', 'nome', 'cor', 'icone'],
            required: false
          },
          {
            model: SubCategory,
            as: 'subcategoriaObj',
            attributes: ['id', 'nome'],
            required: false
          }
        ]
      });

      logger.info(`Solicitação atualizada: ${solicitacao.numero}`, {
        solicitacaoId: solicitacao.id,
        updatedBy: req.user.id,
        changes: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Solicitação atualizada com sucesso',
        data: { solicitacao: solicitacaoAtualizada }
      });

    } catch (error) {
      logger.error('Erro ao atualizar solicitação:', error);
      next(error);
    }
  }

  // Cancelar solicitação
  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const solicitacao = await Solicitacao.findByPk(id);
      
      if (!solicitacao) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      // Verificar permissões - apenas criador ou supervisor/admin pode cancelar
      const canCancel = req.user.perfil === 'administrador' || 
                       req.user.perfil === 'supervisor' ||
                       (solicitacao.solicitante_id === req.user.id && ['aberta', 'em_analise'].includes(solicitacao.status));

      if (!canCancel) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para cancelar esta solicitação'
        });
      }

      if (['fechada', 'cancelada'].includes(solicitacao.status)) {
        return res.status(400).json({
          success: false,
          message: 'Solicitação já foi finalizada'
        });
      }

      const updateData = {
        status: 'cancelada',
        data_fechamento: new Date()
      };

      if (motivo) {
        updateData.observacoes = (solicitacao.observacoes || '') + 
          `\n\n[${new Date().toLocaleString('pt-BR')}] CANCELAMENTO: ${motivo}`;
      }

      await solicitacao.update(updateData);

      logger.info(`Solicitação cancelada: ${solicitacao.numero}`, {
        solicitacaoId: solicitacao.id,
        canceledBy: req.user.id,
        motivo
      });

      res.json({
        success: true,
        message: 'Solicitação cancelada com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao cancelar solicitação:', error);
      next(error);
    }
  }

  // Atribuir responsável
  async assignResponsible(req, res, next) {
    try {
      const { id } = req.params;
      const { responsavel_id } = req.body;

      // Verificar permissões - apenas supervisores e admins
      if (!['supervisor', 'administrador'].includes(req.user.perfil)) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para atribuir responsável'
        });
      }

      const solicitacao = await Solicitacao.findByPk(id);
      
      if (!solicitacao) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      // Verificar se o usuário responsável existe
      if (responsavel_id) {
        const responsavel = await User.findByPk(responsavel_id);
        if (!responsavel) {
          return res.status(400).json({
            success: false,
            message: 'Usuário responsável não encontrado'
          });
        }
      }

      await solicitacao.update({ 
        responsavel_id: responsavel_id || null,
        status: responsavel_id ? 'em_analise' : 'aberta'
      });

      logger.info(`Responsável atribuído para solicitação: ${solicitacao.numero}`, {
        solicitacaoId: solicitacao.id,
        responsavelId: responsavel_id,
        assignedBy: req.user.id
      });

      res.json({
        success: true,
        message: responsavel_id ? 'Responsável atribuído com sucesso' : 'Responsável removido com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao atribuir responsável:', error);
      next(error);
    }
  }

  // Obter estatísticas das solicitações
  async stats(req, res, next) {
    try {
      const whereClause = {};
      
      // Solicitantes só veem suas próprias estatísticas
      if (req.user.perfil === 'solicitante') {
        whereClause.solicitante_id = req.user.id;
      }

      const stats = await Promise.all([
        Solicitacao.count({ where: { ...whereClause, status: 'aberta' } }),
        Solicitacao.count({ where: { ...whereClause, status: 'em_analise' } }),
        Solicitacao.count({ where: { ...whereClause, status: 'aprovada' } }),
        Solicitacao.count({ where: { ...whereClause, status: 'em_execucao' } }),
        Solicitacao.count({ where: { ...whereClause, status: 'fechada' } }),
        Solicitacao.count({ where: { ...whereClause, status: 'cancelada' } }),
        Solicitacao.count({ where: { ...whereClause, prioridade: 'critica' } }),
        Solicitacao.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          aberta: stats[0],
          em_analise: stats[1],
          aprovada: stats[2],
          em_execucao: stats[3],
          fechada: stats[4],
          cancelada: stats[5],
          criticas: stats[6],
          total: stats[7]
        }
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error);
      next(error);
    }
  }
}

module.exports = new SolicitacaoController();