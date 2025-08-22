const { Permission, User, UserPermission } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const PermissionController = {
  // Listar todas as permissões disponíveis
  async index(req, res, next) {
    try {
      const { module = '', active = null } = req.query;

      const whereClause = {};
      
      if (module) {
        whereClause.module = module;
      }
      
      if (active !== null) {
        whereClause.active = active === 'true';
      }

      const permissions = await Permission.findAll({
        where: whereClause,
        order: [['module', 'ASC'], ['action', 'ASC']]
      });

      res.json({
        success: true,
        data: { permissions }
      });

    } catch (error) {
      logger.error('Erro ao listar permissões:', error);
      next(error);
    }
  },

  // Listar módulos únicos das permissões
  async modules(req, res, next) {
    try {
      const modules = await Permission.findAll({
        attributes: ['module'],
        group: ['module'],
        order: [['module', 'ASC']]
      });

      const moduleNames = modules.map(m => m.module);

      res.json({
        success: true,
        data: { modules: moduleNames }
      });

    } catch (error) {
      logger.error('Erro ao listar módulos:', error);
      next(error);
    }
  },

  // Obter uma permissão específica
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const permission = await Permission.findByPk(id);

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permissão não encontrada'
        });
      }

      res.json({
        success: true,
        data: { permission }
      });

    } catch (error) {
      logger.error('Erro ao buscar permissão:', error);
      next(error);
    }
  },

  // Criar nova permissão
  async store(req, res, next) {
    try {
      const { name, description, module, action } = req.body;

      const permission = await Permission.create({
        name,
        description,
        module,
        action
      });

      res.status(201).json({
        success: true,
        data: { permission }
      });

    } catch (error) {
      logger.error('Erro ao criar permissão:', error);
      next(error);
    }
  },

  // Atualizar permissão
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, module, action } = req.body;

      const permission = await Permission.findByPk(id);

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permissão não encontrada'
        });
      }

      await permission.update({
        name,
        description,
        module,
        action
      });

      res.json({
        success: true,
        data: { permission }
      });

    } catch (error) {
      logger.error('Erro ao atualizar permissão:', error);
      next(error);
    }
  },

  // Excluir permissão
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const permission = await Permission.findByPk(id);

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permissão não encontrada'
        });
      }

      await permission.destroy();

      res.json({
        success: true,
        message: 'Permissão excluída com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao excluir permissão:', error);
      next(error);
    }
  },

  // Atribuir permissão a um usuário
  async assignToUser(req, res, next) {
    try {
      const { userId, permissionId } = req.body;

      const [user, permission] = await Promise.all([
        User.findByPk(userId),
        Permission.findByPk(permissionId)
      ]);

      if (!user || !permission) {
        return res.status(404).json({
          success: false,
          message: 'Usuário ou permissão não encontrados'
        });
      }

      await UserPermission.create({
        user_id: userId,
        permission_id: permissionId
      });

      res.json({
        success: true,
        message: 'Permissão atribuída com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao atribuir permissão:', error);
      next(error);
    }
  },

  // Remover permissão de um usuário
  async revokeFromUser(req, res, next) {
    try {
      const { userId, permissionId } = req.body;

      const userPermission = await UserPermission.findOne({
        where: {
          user_id: userId,
          permission_id: permissionId
        }
      });

      if (!userPermission) {
        return res.status(404).json({
          success: false,
          message: 'Permissão não encontrada para este usuário'
        });
      }

      await userPermission.destroy();

      res.json({
        success: true,
        message: 'Permissão removida com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao remover permissão:', error);
      next(error);
    }
  }
};

module.exports = PermissionController;
