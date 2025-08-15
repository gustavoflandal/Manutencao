const AuthService = require('../services/AuthService');
const { User } = require('../models');
const logger = require('../config/logger');

// Middleware de autenticação
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido'
      });
    }

    // Verificar token
    const decoded = AuthService.verifyAccessToken(token);
    
    // Buscar usuário no banco
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'nome', 'email', 'perfil', 'ativo']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Usuário inativo'
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    req.token = token;
    
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

    logger.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware opcional de autenticação (não retorna erro se não autenticado)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return next();
    }

    const decoded = AuthService.verifyAccessToken(token);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'nome', 'email', 'perfil', 'ativo']
    });

    if (user && user.ativo) {
      req.user = user;
      req.token = token;
    }

    next();

  } catch (error) {
    // Em caso de erro, apenas continue sem autenticar
    logger.warn('Erro na autenticação opcional:', error.message);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};