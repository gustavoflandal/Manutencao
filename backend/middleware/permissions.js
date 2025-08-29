const AuthService = require('../services/AuthService');
const { User, Permission } = require('../models');
const logger = require('../config/logger');

/**
 * Middleware de autenticação
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    try {
      // Verificar token
      const decoded = AuthService.verifyToken(token);
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'nome', 'email', 'perfil', 'ativo'],
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }]
      });
      
      if (!user || !user.ativo) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou inativo'
        });
      }

      // Adicionar usuário ao request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
  } catch (error) {
    logger.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao autenticar usuário'
    });
  }
};

/**
 * Middleware para verificar permissão específica
 */
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Administradores têm todas as permissões
      if (req.user.perfil === 'administrador') {
        return next();
      }

      // Verificar permissão específica
      const hasPermission = req.user.permissions.some(p => p.name === permission);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este recurso'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro ao verificar permissão:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão'
      });
    }
  };
};

/**
 * Middleware para verificar perfil/role do usuário
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const userRole = req.user.perfil;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este recurso'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro ao verificar perfil:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão'
      });
    }
  };
};

/**
 * Middleware para verificar se o usuário é o proprietário do recurso ou administrador
 */
const requireOwnershipOrAdmin = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Administradores têm acesso total
      if (req.user.perfil === 'administrador') {
        return next();
      }

      // Verificar se o usuário está tentando acessar seu próprio recurso
      const resourceId = req.params.id;
      if (resourceId && resourceId == req.user.id) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar este recurso'
      });
    } catch (error) {
      logger.error('Erro ao verificar propriedade:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão'
      });
    }
  };
};

/**
 * Middleware para verificar se o usuário tem qualquer um dos perfis especificados
 */
const requireAnyRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const userRole = req.user.perfil;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este recurso'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro ao verificar perfil:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão'
      });
    }
  };
};

module.exports = {
  authenticate,
  checkPermission,
  requireRole,
  requireAnyRole,
  requireOwnershipOrAdmin
};