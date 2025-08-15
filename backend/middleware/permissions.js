const logger = require('../config/logger');

// Hierarquia de perfis (do menor para o maior privilégio)
const PERFIL_HIERARCHY = {
  'solicitante': 1,
  'tecnico': 2,
  'supervisor': 3,
  'administrador': 4
};

// Middleware para verificar se o usuário tem o perfil mínimo necessário
const requireRole = (minRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const userRoleLevel = PERFIL_HIERARCHY[req.user.perfil];
      const requiredRoleLevel = PERFIL_HIERARCHY[minRole];

      if (!userRoleLevel || !requiredRoleLevel) {
        logger.error('Perfil inválido detectado:', {
          userRole: req.user.perfil,
          requiredRole: minRole
        });
        
        return res.status(500).json({
          success: false,
          message: 'Erro de configuração de permissões'
        });
      }

      if (userRoleLevel < requiredRoleLevel) {
        logger.warn('Acesso negado por falta de permissão:', {
          userId: req.user.id,
          userRole: req.user.perfil,
          requiredRole: minRole,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este recurso'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro no middleware de permissões:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

// Middleware para verificar se o usuário tem exatamente o perfil especificado
const requireExactRole = (role) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      if (req.user.perfil !== role) {
        logger.warn('Acesso negado por perfil incorreto:', {
          userId: req.user.id,
          userRole: req.user.perfil,
          requiredRole: role,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este recurso'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro no middleware de permissões exatas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

// Middleware para verificar se o usuário tem um dos perfis especificados
const requireAnyRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      if (!roles.includes(req.user.perfil)) {
        logger.warn('Acesso negado por perfil não autorizado:', {
          userId: req.user.id,
          userRole: req.user.perfil,
          allowedRoles: roles,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'Sem permissão para acessar este recurso'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro no middleware de múltiplas permissões:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

// Middleware para verificar se o usuário pode acessar seus próprios dados ou é admin
const requireOwnershipOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const targetUserId = parseInt(req.params[userIdParam]);
      const currentUserId = req.user.id;
      const isAdmin = req.user.perfil === 'administrador';

      // Admin pode acessar qualquer recurso
      if (isAdmin) {
        return next();
      }

      // Usuário só pode acessar seus próprios dados
      if (targetUserId === currentUserId) {
        return next();
      }

      logger.warn('Acesso negado por falta de propriedade:', {
        userId: currentUserId,
        targetUserId: targetUserId,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        message: 'Você só pode acessar seus próprios dados'
      });

    } catch (error) {
      logger.error('Erro no middleware de propriedade:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

// Função para verificar se um perfil tem permissão para executar uma ação
const hasPermission = (userRole, requiredRole) => {
  const userRoleLevel = PERFIL_HIERARCHY[userRole];
  const requiredRoleLevel = PERFIL_HIERARCHY[requiredRole];
  
  return userRoleLevel && requiredRoleLevel && userRoleLevel >= requiredRoleLevel;
};

// Função para obter o nível hierárquico de um perfil
const getRoleLevel = (role) => {
  return PERFIL_HIERARCHY[role] || 0;
};

module.exports = {
  requireRole,
  requireExactRole,
  requireAnyRole,
  requireOwnershipOrAdmin,
  hasPermission,
  getRoleLevel,
  PERFIL_HIERARCHY
};
