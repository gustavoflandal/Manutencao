const { OrdemServico, Ativo, User, Solicitacao, Setor, FmeaAnalysis } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const OrdemServicoController = {
  // Listar todas as ordens de serviço
  async index(req, res, next) {
    try {
      const ordens = await OrdemServico.findAll({
        where: { deleted_at: null },
        include: [
          {
            model: Ativo,
            as: 'ativo',
            attributes: ['id', 'nome', 'codigo_patrimonio'],
            include: [{
              model: Setor,
              as: 'setor',
              attributes: ['id', 'nome', 'codigo']
            }]
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
            model: FmeaAnalysis,
            as: 'fmea',
            attributes: ['id', 'component', 'failure_mode', 'rpn']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: ordens
      });
    } catch (error) {
      logger.error('Erro ao listar ordens de serviço:', error);
      next(error);
    }
  },

  // Buscar ordem de serviço específica
  async show(req, res, next) {
    try {
      const ordem = await OrdemServico.findOne({
        where: { 
          id: req.params.id,
          deleted_at: null
        },
        include: [
          {
            model: Ativo,
            as: 'ativo',
            include: [{
              model: Setor,
              as: 'setor',
              attributes: ['id', 'nome', 'codigo']
            }]
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
            model: FmeaAnalysis,
            as: 'fmea',
            attributes: ['id', 'component', 'failure_mode', 'rpn']
          }
        ]
      });

      if (!ordem) {
        throw new AppError('Ordem de serviço não encontrada', 404);
      }

      res.json({
        success: true,
        data: ordem
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
        tipo,
        descricao_servico,
        prioridade,
        data_inicio_prevista,
        data_fim_prevista,
        horas_planejadas,
        observacoes,
        fmea_id
      } = req.body;

      // Verificar se o ativo existe e está ativo
      const ativo = await Ativo.findOne({
        where: { 
          id: ativo_id,
          ativo: true,
          deleted_at: null
        },
        include: [{
          model: Setor,
          as: 'setor'
        }]
      });

      if (!ativo) {
        throw new AppError('Ativo não encontrado ou inativo', 404);
      }

      // Verificar FMEA se fornecido
      if (fmea_id) {
        const fmea = await FmeaAnalysis.findOne({
          where: {
            id: fmea_id,
            equipment_id: ativo_id,
            deleted_at: null
          }
        });
        if (!fmea) {
          throw new AppError('FMEA não encontrada ou não pertence ao ativo', 404);
        }
      }

      const ordem = await OrdemServico.create({
        ativo_id,
        tipo,
        descricao_servico,
        prioridade,
        data_inicio_prevista,
        data_fim_prevista,
        horas_planejadas,
        observacoes_execucao: observacoes,
        solicitante_id: req.user.id,
        fmea_id
      });

      // Buscar ordem com relacionamentos
      const ordemCompleta = await OrdemServico.findByPk(ordem.id, {
        include: [
          {
            model: Ativo,
            as: 'ativo',
            include: [{
              model: Setor,
              as: 'setor',
              attributes: ['id', 'nome', 'codigo']
            }]
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
            model: FmeaAnalysis,
            as: 'fmea',
            attributes: ['id', 'component', 'failure_mode', 'rpn']
          }
        ]
      });

      // Log da criação
      logger.info(`Ordem de serviço ${ordem.numero_os} criada`, {
        os_id: ordem.id,
        ativo_id,
        setor_id: ativo.setor.id,
        solicitante_id: req.user.id
      });

      res.status(201).json({
        success: true,
        data: ordemCompleta
      });
    } catch (error) {
      logger.error('Erro ao criar ordem de serviço:', error);
      next(error);
    }
  },

  // Atualizar ordem de serviço
  async update(req, res, next) {
    try {
      const ordem = await OrdemServico.findOne({
        where: { 
          id: req.params.id,
          deleted_at: null
        },
        include: [
          {
            model: Ativo,
            as: 'ativo',
            include: [{
              model: Setor,
              as: 'setor'
            }]
          }
        ]
      });

      if (!ordem) {
        throw new AppError('Ordem de serviço não encontrada', 404);
      }

      // Verificar permissão
      const canEdit = req.user.perfil === 'administrador' || 
                     req.user.perfil === 'supervisor' ||
                     ordem.responsavel_id === req.user.id ||
                     ordem.solicitante_id === req.user.id;

      if (!canEdit) {
        throw new AppError('Sem permissão para editar esta OS', 403);
      }

      // Se estiver alterando o ativo, verificar se existe e está ativo
      if (req.body.ativo_id && req.body.ativo_id !== ordem.ativo_id) {
        const ativo = await Ativo.findOne({
          where: { 
            id: req.body.ativo_id,
            ativo: true,
            deleted_at: null
          }
        });
        if (!ativo) {
          throw new AppError('Novo ativo não encontrado ou inativo', 404);
        }
      }

      await ordem.update(req.body);

      // Buscar ordem atualizada com relacionamentos
      const ordemAtualizada = await OrdemServico.findByPk(ordem.id, {
        include: [
          {
            model: Ativo,
            as: 'ativo',
            include: [{
              model: Setor,
              as: 'setor',
              attributes: ['id', 'nome', 'codigo']
            }]
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
            model: FmeaAnalysis,
            as: 'fmea',
            attributes: ['id', 'component', 'failure_mode', 'rpn']
          }
        ]
      });

      // Log da atualização
      logger.info(`Ordem de serviço ${ordem.numero_os} atualizada`, {
        os_id: ordem.id,
        ativo_id: ordemAtualizada.ativo_id,
        setor_id: ordemAtualizada.ativo.setor.id,
        updated_by: req.user.id
      });

      res.json({
        success: true,
        data: ordemAtualizada
      });
    } catch (error) {
      logger.error('Erro ao atualizar ordem de serviço:', error);
      next(error);
    }
  },

  // Deletar ordem de serviço
  async destroy(req, res, next) {
    try {
      const ordem = await OrdemServico.findOne({
        where: { 
          id: req.params.id,
          deleted_at: null
        },
        include: [
          {
            model: Ativo,
            as: 'ativo',
            include: [{
              model: Setor,
              as: 'setor'
            }]
          }
        ]
      });

      if (!ordem) {
        throw new AppError('Ordem de serviço não encontrada', 404);
      }

      // Verificar permissão
      if (!['administrador', 'supervisor'].includes(req.user.perfil)) {
        throw new AppError('Sem permissão para excluir OS', 403);
      }

      // Não permitir excluir OS concluída
      if (ordem.status === 'concluida') {
        throw new AppError('Não é possível excluir OS concluída', 400);
      }

      // Soft delete
      await ordem.update({ 
        deleted_at: new Date(),
        status: 'cancelada'
      });

      // Log da exclusão
      logger.info(`Ordem de serviço ${ordem.numero_os} excluída`, {
        os_id: ordem.id,
        ativo_id: ordem.ativo_id,
        setor_id: ordem.ativo.setor.id,
        deleted_by: req.user.id
      });

      res.json({
        success: true,
        message: 'Ordem de serviço excluída com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir ordem de serviço:', error);
      next(error);
    }
  }
};

module.exports = OrdemServicoController;