const { Permission, User, UserPermission } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class PermissionController {
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
  }

  // Listar permissões de um usuário específico
  async getUserPermissions(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: {
            model: UserPermission,
            as: 'userPermission',
            attributes: ['granted_at', 'expires_at', 'active']
          }
        }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil
          },
          permissions: user.permissions
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar permissões do usuário:', error);
      next(error);
    }
  }

  // Conceder permissão a um usuário
  async grantPermission(req, res, next) {
    try {
      const { userId } = req.params;
      const { permissionId, expiresAt } = req.body;

      // Verificar se usuário existe
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se permissão existe
      const permission = await Permission.findByPk(permissionId);
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permissão não encontrada'
        });
      }

      // Verificar se já existe
      const existing = await UserPermission.findOne({
        where: {
          user_id: userId,
          permission_id: permissionId
        }
      });

      if (existing) {
        // Atualizar se já existe
        await existing.update({
          active: true,
          expires_at: expiresAt || null,
          granted_by: req.user.id,
          granted_at: new Date()
        });
      } else {
        // Criar nova associação
        await UserPermission.create({
          user_id: userId,
          permission_id: permissionId,
          granted_by: req.user.id,
          expires_at: expiresAt || null,
          active: true
        });
      }

      logger.info(`Permissão concedida: ${permission.name} para ${user.email}`, {
        userId: user.id,
        permissionId: permission.id,
        grantedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Permissão concedida com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao conceder permissão:', error);
      next(error);
    }
  }

  // Revogar permissão de um usuário
  async revokePermission(req, res, next) {
    try {
      const { userId, permissionId } = req.params;

      const userPermission = await UserPermission.findOne({
        where: {
          user_id: userId,
          permission_id: permissionId
        },
        include: [
          { model: User, as: 'user', attributes: ['nome', 'email'] },
          { model: Permission, as: 'permission', attributes: ['name'] }
        ]
      });

      if (!userPermission) {
        return res.status(404).json({
          success: false,
          message: 'Permissão não encontrada para este usuário'
        });
      }

      await userPermission.update({ active: false });

      logger.info(`Permissão revogada: ${userPermission.permission.name} de ${userPermission.user.email}`, {
        userId: userPermission.user_id,
        permissionId: userPermission.permission_id,
        revokedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Permissão revogada com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao revogar permissão:', error);
      next(error);
    }
  }

  // Atualizar permissões em lote para um usuário
  async updateUserPermissions(req, res, next) {
    try {
      const { userId } = req.params;
      const { permissions } = req.body; // Array de IDs de permissões

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Desativar todas as permissões atuais
      await UserPermission.update(
        { active: false },
        { where: { user_id: userId } }
      );

      // Adicionar/ativar as novas permissões
      if (permissions && permissions.length > 0) {
        for (const permissionId of permissions) {
          const existing = await UserPermission.findOne({
            where: {
              user_id: userId,
              permission_id: permissionId
            }
          });

          if (existing) {
            await existing.update({
              active: true,
              granted_by: req.user.id,
              granted_at: new Date()
            });
          } else {
            await UserPermission.create({
              user_id: userId,
              permission_id: permissionId,
              granted_by: req.user.id,
              active: true
            });
          }
        }
      }

      logger.info(`Permissões atualizadas para usuário: ${user.email}`, {
        userId: user.id,
        permissionCount: permissions?.length || 0,
        updatedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Permissões atualizadas com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao atualizar permissões:', error);
      next(error);
    }
  }

  // Criar nova permissão (apenas para administradores)
  async store(req, res, next) {
    try {
      const { name, description, module, action, resource } = req.body;

      if (!name || !module || !action) {
        return res.status(400).json({
          success: false,
          message: 'Nome, módulo e ação são obrigatórios'
        });
      }

      const permission = await Permission.create({
        name: name.trim(),
        description: description?.trim(),
        module: module.trim(),
        action: action.trim(),
        resource: resource?.trim()
      });

      logger.info(`Nova permissão criada: ${permission.name}`, {
        permissionId: permission.id,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Permissão criada com sucesso',
        data: { permission }
      });

    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma permissão com este nome ou combinação módulo/ação/recurso'
        });
      }
      
      logger.error('Erro ao criar permissão:', error);
      next(error);
    }
  }

  // Listar módulos disponíveis
  async getModules(req, res, next) {
    try {
      const modules = await Permission.findAll({
        attributes: ['module'],
        group: ['module'],
        where: { active: true },
        order: [['module', 'ASC']]
      });

      const moduleList = modules.map(m => m.module);

      res.json({
        success: true,
        data: { modules: moduleList }
      });

    } catch (error) {
      logger.error('Erro ao listar módulos:', error);
      next(error);
    }
  }
}

module.exports = new PermissionController();
