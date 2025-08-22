const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AuthService = require('../services/AuthService');

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

    // Usar AuthService para verificar token com audience/issuer
    const decoded = AuthService.verifyAccessToken(token);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Erro ao autenticar usuário',
      error: error.message
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

      const userPermissions = await req.user.getPermissions();
      const hasPermission = userPermissions.some(p => p.name === permission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este recurso'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão',
        error: error.message
      });
    }
  };
};

/**
 * Middleware para verificar papel do usuário
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(req.user.perfil)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado: perfil não autorizado'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar perfil do usuário',
        error: error.message
      });
    }
  };
};

/**
 * Middleware para verificar propriedade do recurso
 */
const requireOwnershipOrAdmin = () => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      if (req.user.perfil === 'administrador') {
        return next();
      }

      const resourceId = req.params.id;
      if (req.user.id.toString() !== resourceId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado: recurso pertence a outro usuário'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar propriedade do recurso',
        error: error.message
      });
    }
  };
};

/**
 * Middleware para verificar se o usuário possui QUALQUER UM dos papéis especificados
 */
const requireAnyRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(req.user.perfil)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado: perfil não autorizado'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar perfil do usuário',
        error: error.message
      });
    }
  };
};

// Exportar todas as funções em um único objetonpm install
module.exports = {
  authenticate,
  checkPermission,
  requireRole,
  requireAnyRole,
  requireOwnershipOrAdmin
};