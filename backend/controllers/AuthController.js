const { User, Permission } = require('../models');
const AuthService = require('../services/AuthService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const AuthController = {
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;

      // Validar dados de entrada
      if (!email || !senha) {
        throw new AppError('Email e senha são obrigatórios', 400);
      }

      // Buscar usuário
      const user = await User.findOne({
        where: { email },
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      if (!user) {
        throw new AppError('Credenciais inválidas', 401);
      }

      // Verificar senha
      const senhaCorreta = await user.validatePassword(senha);
      if (!senhaCorreta) {
        throw new AppError('Credenciais inválidas', 401);
      }

      // Gerar token
      const token = AuthService.generateToken(user);

      // Log de login
      logger.info(`Usuário ${user.email} logado com sucesso`);

      // Retornar token e dados do usuário
      res.json({
        success: true,
        data: {
          accessToken: token,
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            permissions: user.permissions.map(p => p.name)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async verify(req, res, next) {
    try {
      // Verificar se o token está presente no header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido'
        });
      }

      // Extrair o token do header (formato: "Bearer TOKEN")
      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido'
        });
      }

      // Verificar e decodificar o token
      const decoded = AuthService.verifyToken(token);

      // Buscar o usuário no banco
      const user = await User.findByPk(decoded.id, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Retornar dados do usuário
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            permissions: user.permissions.map(p => p.name)
          }
        }
      });
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
      next(error);
    }
  }
};

module.exports = AuthController;