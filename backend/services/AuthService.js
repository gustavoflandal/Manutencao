const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'seu-jwt-secret-muito-seguro-aqui';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'seu-jwt-refresh-secret-muito-seguro-aqui';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  // Gerar access token
  generateAccessToken(payload) {
    try {
      return jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn,
        issuer: 'sistema-manutencao',
        audience: 'sistema-manutencao-users'
      });
    } catch (error) {
      logger.error('Erro ao gerar access token:', error);
      throw new Error('Erro ao gerar token de acesso');
    }
  }

  // Gerar refresh token
  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, this.jwtRefreshSecret, {
        expiresIn: this.jwtRefreshExpiresIn,
        issuer: 'sistema-manutencao',
        audience: 'sistema-manutencao-users'
      });
    } catch (error) {
      logger.error('Erro ao gerar refresh token:', error);
      throw new Error('Erro ao gerar token de renovação');
    }
  }

  // Verificar access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'sistema-manutencao',
        audience: 'sistema-manutencao-users'
      });
    } catch (error) {
      logger.warn('Token de acesso inválido:', error.message);
      throw error;
    }
  }

  // Verificar refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'sistema-manutencao',
        audience: 'sistema-manutencao-users'
      });
    } catch (error) {
      logger.warn('Refresh token inválido:', error.message);
      throw error;
    }
  }

  // Decodificar token sem verificar (para debug)
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Erro ao decodificar token:', error);
      return null;
    }
  }

  // Verificar se token está expirado
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Extrair informações do token
  extractTokenInfo(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return null;
      }
      
      return {
        userId: decoded.payload.id,
        email: decoded.payload.email,
        perfil: decoded.payload.perfil,
        issuedAt: new Date(decoded.payload.iat * 1000),
        expiresAt: new Date(decoded.payload.exp * 1000),
        isExpired: this.isTokenExpired(token)
      };
    } catch (error) {
      logger.error('Erro ao extrair informações do token:', error);
      return null;
    }
  }
}

module.exports = new AuthService();
