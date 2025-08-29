const { FmeaAnalysis, Ativo, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const FmeaController = {
  // Listar todas as análises FMEA
  async index(req, res, next) {
    try {
      const fmeas = await FmeaAnalysis.findAll({
        where: { deleted_at: null },
        include: [
          {
            model: Ativo,
            as: 'equipment',
            attributes: ['id', 'nome', 'codigo_patrimonio']
          },
          {
            model: User,
            as: 'analyst',
            attributes: ['id', 'nome', 'email']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: fmeas
      });
    } catch (error) {
      logger.error('Erro ao listar FMEAs:', error);
      next(error);
    }
  },

  // Buscar análise FMEA específica
  async show(req, res, next) {
    try {
      const fmea = await FmeaAnalysis.findOne({
        where: { 
          id: req.params.id,
          deleted_at: null
        },
        include: [
          {
            model: Ativo,
            as: 'equipment',
            attributes: ['id', 'nome', 'codigo_patrimonio']
          },
          {
            model: User,
            as: 'analyst',
            attributes: ['id', 'nome', 'email']
          }
        ]
      });

      if (!fmea) {
        throw new AppError('FMEA não encontrada', 404);
      }

      res.json({
        success: true,
        data: fmea
      });
    } catch (error) {
      logger.error('Erro ao buscar FMEA:', error);
      next(error);
    }
  },

  // Criar nova análise FMEA
  async create(req, res, next) {
    try {
      const {
        equipment_id,
        component,
        function: functionDesc,
        failure_mode,
        failure_effect,
        failure_cause,
        current_controls,
        severity,
        occurrence,
        detection,
        status = 'draft'
      } = req.body;

      // Verificar se o equipamento existe
      const ativo = await Ativo.findByPk(equipment_id);
      if (!ativo) {
        throw new AppError('Equipamento não encontrado', 404);
      }

      // Calcular RPN
      const rpn = severity * occurrence * detection;

      const fmea = await FmeaAnalysis.create({
        equipment_id,
        component,
        function: functionDesc,
        failure_mode,
        failure_effect,
        failure_cause,
        current_controls,
        severity,
        occurrence,
        detection,
        rpn,
        status,
        analyst_id: req.user.id
      });

      // Buscar FMEA com relacionamentos
      const fmeaCompleta = await FmeaAnalysis.findByPk(fmea.id, {
        include: [
          {
            model: Ativo,
            as: 'equipment',
            attributes: ['id', 'nome', 'codigo_patrimonio']
          },
          {
            model: User,
            as: 'analyst',
            attributes: ['id', 'nome', 'email']
          }
        ]
      });

      // Log da criação
      logger.info(`FMEA criada para equipamento ${equipment_id}`, {
        fmea_id: fmea.id,
        equipment_id,
        analyst_id: req.user.id,
        rpn
      });

      res.status(201).json({
        success: true,
        data: fmeaCompleta
      });
    } catch (error) {
      logger.error('Erro ao criar FMEA:', error);
      next(error);
    }
  },

  // Atualizar análise FMEA
  async update(req, res, next) {
    try {
      const fmea = await FmeaAnalysis.findOne({
        where: { 
          id: req.params.id,
          deleted_at: null
        }
      });

      if (!fmea) {
        throw new AppError('FMEA não encontrada', 404);
      }

      // Se houver alteração nos valores que compõem o RPN, recalcular
      const { severity, occurrence, detection } = req.body;
      if (severity || occurrence || detection) {
        req.body.rpn = (severity || fmea.severity) * 
                       (occurrence || fmea.occurrence) * 
                       (detection || fmea.detection);
      }

      await fmea.update(req.body);

      // Buscar FMEA atualizada com relacionamentos
      const fmeaAtualizada = await FmeaAnalysis.findByPk(fmea.id, {
        include: [
          {
            model: Ativo,
            as: 'equipment',
            attributes: ['id', 'nome', 'codigo_patrimonio']
          },
          {
            model: User,
            as: 'analyst',
            attributes: ['id', 'nome', 'email']
          }
        ]
      });

      // Log da atualização
      logger.info(`FMEA ${fmea.id} atualizada`, {
        fmea_id: fmea.id,
        updated_by: req.user.id,
        new_rpn: req.body.rpn
      });

      res.json({
        success: true,
        data: fmeaAtualizada
      });
    } catch (error) {
      logger.error('Erro ao atualizar FMEA:', error);
      next(error);
    }
  },

  // Deletar análise FMEA
  async destroy(req, res, next) {
    try {
      const fmea = await FmeaAnalysis.findOne({
        where: { 
          id: req.params.id,
          deleted_at: null
        }
      });

      if (!fmea) {
        throw new AppError('FMEA não encontrada', 404);
      }

      // Soft delete
      await fmea.update({ 
        deleted_at: new Date(),
        status: 'archived'
      });

      // Log da exclusão
      logger.info(`FMEA ${fmea.id} excluída`, {
        fmea_id: fmea.id,
        deleted_by: req.user.id
      });

      res.json({
        success: true,
        message: 'FMEA excluída com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir FMEA:', error);
      next(error);
    }
  }
};

module.exports = FmeaController;