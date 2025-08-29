const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-aqui';
const JWT_EXPIRES_IN = '24h';

class AuthService {
  generateToken(user) {
    try {
      return jwt.sign(
        {
          id: user.id,
          email: user.email,
          perfil: user.perfil
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
    } catch (error) {
      logger.error('Erro ao gerar token:', error);
      throw new Error('Erro ao gerar token de acesso');
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.warn('Token inválido:', error.message);
      throw error;
    }
  }
}

module.exports = new AuthService();