const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const AuthService = require('../services/AuthService');
const AuditoriaService = require('../services/AuditoriaService');
const logger = require('../config/logger');

class AuthController {
  // Registro de usuário (apenas para criar o primeiro admin)
  async register(req, res, next) {
    try {
      const { nome, email, senha, codigo_admin } = req.body;

      // Validação básica
      if (!nome || !email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
      }

      if (senha.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A senha deve ter pelo menos 6 caracteres'
        });
      }

      // Verificar se já existe algum usuário administrador
      const adminExists = await User.findOne({
        where: { perfil: 'administrador' }
      });

      // Se já existe admin e não forneceu código correto, bloquear
      if (adminExists && codigo_admin !== 'SETUP_ADMIN_2025') {
        return res.status(403).json({
          success: false,
          message: 'Registro não permitido. Sistema já possui administrador.'
        });
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está em uso'
        });
      }

      // Criar usuário (primeiro será admin, demais serão solicitantes)
      const userData = {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha,
        perfil: adminExists ? 'solicitante' : 'administrador',
        ativo: true
      };

      const user = await User.create(userData);

      logger.info(`Usuário registrado: ${user.email}`, {
        userId: user.id,
        perfil: user.perfil,
        isFirstAdmin: !adminExists
      });

      res.status(201).json({
        success: true,
        message: `Usuário ${user.perfil} criado com sucesso`,
        data: {
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil
          }
        }
      });

    } catch (error) {
      logger.error('Erro no registro:', error);
      next(error);
    }
  }

  // Login de usuário
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;

      console.log('🔍 Login attempt for:', email);

      // Validação básica
      if (!email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      console.log('✅ Basic validation passed');

      // Buscar usuário por email
      const user = await User.findOne({ 
        where: { email: email.toLowerCase() },
        attributes: ['id', 'nome', 'email', 'senha', 'perfil', 'ativo']
      });

      console.log('🔍 User found:', user ? 'YES' : 'NO');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      // Verificar se o usuário está ativo
      if (!user.ativo) {
        return res.status(401).json({
          success: false,
          message: 'Usuário inativo. Contate o administrador.'
        });
      }

      console.log('✅ User active check passed');

      // Verificar senha
      const senhaValida = await user.validatePassword(senha);
      console.log('🔍 Password valid:', senhaValida);
      
      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }

      console.log('✅ Password validation passed');

      // Gerar tokens
      const tokenData = {
        id: user.id,
        email: user.email,
        perfil: user.perfil
      };

      console.log('🔍 Generating tokens...');
      
      // Teste simples para verificar se AuthService funciona
      let accessToken, refreshToken;
      try {
        console.log('Testando generateAccessToken...');
        accessToken = AuthService.generateAccessToken(tokenData);
        console.log('✅ Access token gerado:', accessToken ? 'OK' : 'FALHOU');
        
        console.log('Testando generateRefreshToken...');
        refreshToken = AuthService.generateRefreshToken(tokenData);
        console.log('✅ Refresh token gerado:', refreshToken ? 'OK' : 'FALHOU');
        
        console.log('✅ Tokens generated successfully');
      } catch (tokenError) {
        console.error('❌ Erro ao gerar tokens:', tokenError);
        throw tokenError;
      }

      // Atualizar último login
      await user.update({ ultimo_login: new Date() });
      console.log('✅ Last login updated');

      // Log de sucesso
      logger.info(`Login realizado: ${user.email}`, {
        userId: user.id,
        ip: req.ip
      });

      console.log('✅ About to send response');

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil
          },
          accessToken,
          refreshToken
        }
      });

      console.log('✅ Response sent successfully');

    } catch (error) {
      console.error('❌ Login error:', error);
      logger.error('Erro no login:', error);
      next(error);
    }
  }

  // Refresh token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token é obrigatório'
        });
      }

      // Verificar refresh token
      const decoded = AuthService.verifyRefreshToken(refreshToken);
      
      // Buscar usuário para verificar se ainda está ativo
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'perfil', 'ativo']
      });

      if (!user || !user.ativo) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      // Gerar novo access token
      const tokenData = {
        id: user.id,
        email: user.email,
        perfil: user.perfil
      };

      const newAccessToken = AuthService.generateAccessToken(tokenData);

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          accessToken: newAccessToken
        }
      });

    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }
      
      logger.error('Erro no refresh token:', error);
      next(error);
    }
  }

  // Logout
  async logout(req, res) {
    try {
      // Registrar logout na auditoria
      await AuditoriaService.registrarLogout(req.user, req);
      
      // Aqui poderia implementar blacklist de tokens se necessário
      logger.info(`Logout realizado: ${req.user.email}`, {
        userId: req.user.id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Verificar token
  async verify(req, res) {
    try {
      // Se chegou até aqui, o token é válido (passou pelo middleware de auth)
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'nome', 'email', 'perfil', 'ativo']
      });

      if (!user || !user.ativo) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou inativo'
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
          }
        }
      });
    } catch (error) {
      logger.error('Erro na verificação de token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Alterar senha
  async changePassword(req, res, next) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      const userId = req.user.id;

      // Validações
      if (!senhaAtual || !novaSenha) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual e nova senha são obrigatórias'
        });
      }

      if (novaSenha.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha deve ter pelo menos 6 caracteres'
        });
      }

      // Buscar usuário
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'senha']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar senha atual
      const senhaValida = await user.validatePassword(senhaAtual);
      if (!senhaValida) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Atualizar senha
      await user.update({ senha: novaSenha });

      logger.info(`Senha alterada: ${user.email}`, {
        userId: user.id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });

    } catch (error) {
      logger.error('Erro na alteração de senha:', error);
      next(error);
    }
  }

  // Registro público de usuários
  async publicRegister(req, res, next) {
    try {
      const { nome, email, senha } = req.body;

      // Validação básica
      if (!nome || !email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
      }

      if (senha.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A senha deve ter pelo menos 6 caracteres'
        });
      }

      // Validação de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está em uso'
        });
      }

      // Criar usuário com perfil de solicitante
      const userData = {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha,
        perfil: 'solicitante',
        ativo: true
      };

      const user = await User.create(userData);

      logger.info(`Usuário registrado publicamente: ${user.email}`, {
        userId: user.id,
        perfil: user.perfil
      });

      res.status(201).json({
        success: true,
        message: 'Conta criada com sucesso! Você pode fazer login agora.',
        data: {
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil
          }
        }
      });

    } catch (error) {
      logger.error('Erro no registro público:', error);
      next(error);
    }
  }

  // Recuperação de senha
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // Validação básica
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório'
        });
      }

      // Buscar usuário pelo email
      const user = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      // Por segurança, sempre retornar sucesso, mesmo se o email não existir
      if (!user) {
        logger.warn(`Tentativa de recuperação de senha para email inexistente: ${email}`);
        return res.json({
          success: true,
          message: 'Se o email existir em nossa base de dados, você receberá instruções para recuperar sua senha.'
        });
      }

      // TODO: Implementar envio de email com token de recuperação
      // Por enquanto, apenas simular o processo
      logger.info(`Solicitação de recuperação de senha: ${user.email}`, {
        userId: user.id,
        ip: req.ip
      });

      // Simular delay de envio de email
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json({
        success: true,
        message: 'Se o email existir em nossa base de dados, você receberá instruções para recuperar sua senha.'
      });

    } catch (error) {
      logger.error('Erro na recuperação de senha:', error);
      next(error);
    }
  }
}

module.exports = new AuthController();