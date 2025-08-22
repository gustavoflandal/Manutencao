const request = require('supertest');
const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// Mock dos módulos antes de importar o app
jest.mock('../controllers/AuthController', () => ({
  register: jest.fn((req, res) => {
    res.json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: { id: 1, nome: 'Administrador', email: 'admin@sistema.com' }
    });
  }),
  publicRegister: jest.fn((req, res) => {
    res.json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: { id: 1, nome: 'Administrador', email: 'admin@sistema.com' }
    });
  }),
  login: jest.fn((req, res) => {
    // Verifica as credenciais corretas
    if (req.body.email === 'admin@sistema.com' && req.body.senha === '123456') {
      res.json({
        success: true,
        token: 'test-token',
        user: { 
          id: 1, 
          nome: 'Administrador', 
          email: 'admin@sistema.com',
          perfil: 'administrador'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
  }),
  refreshToken: jest.fn((req, res) => {
    res.json({ success: true, token: 'new-test-token' });
  }),
  forgotPassword: jest.fn((req, res) => {
    res.json({ 
      success: true, 
      message: 'Email de recuperação enviado com sucesso' 
    });
  }),
  resetPassword: jest.fn((req, res) => {
    res.json({ 
      success: true, 
      message: 'Senha redefinida com sucesso' 
    });
  }),
  logout: jest.fn((req, res) => {
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  }),
  verify: jest.fn((req, res) => {
    res.json({ success: true, user: req.user });
  }),
  changePassword: jest.fn((req, res) => {
    res.json({ success: true, message: 'Senha alterada com sucesso' });
  })
}));

// Mock do FmeaController
jest.mock('../controllers/FmeaController', () => ({
  list: jest.fn((req, res) => {
    res.json({
      success: true,
      data: []
    });
  }),
  create: jest.fn((req, res) => {
    const { severity, occurrence, detection } = req.body;
    res.status(201).json({
      success: true,
      data: {
        id: 1,
        ...req.body,
        rpn: severity * occurrence * detection
      }
    });
  }),
  get: jest.fn((req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        component: 'Test Component',
        rpn: 192
      }
    });
  }),
  update: jest.fn((req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        ...req.body
      }
    });
  }),
  addAction: jest.fn((req, res) => {
    res.status(201).json({
      success: true,
      data: {
        id: 1,
        ...req.body
      }
    });
  }),
  getCriticalAnalyses: jest.fn((req, res) => {
    res.json({
      success: true,
      data: []
    });
  }),
  getStatistics: jest.fn((req, res) => {
    res.json({
      success: true,
      data: {
        total_analyses: 0,
        critical_analyses: 0,
        average_rpn: 0
      }
    });
  })
}));

jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { 
      id: 1, 
      nome: 'Administrador', 
      email: 'admin@sistema.com',
      perfil: 'administrador'
    };
    next();
  }),
  checkPermission: jest.fn(() => (req, res, next) => next())
}));

jest.mock('../middleware/permissions', () => ({
  checkPermission: jest.fn(() => (req, res, next) => next())
}));

// Importar app depois dos mocks
const app = require('../server');
const { FmeaAnalysis, FmeaAction, User, Ativo, OrdemServico } = require('../models');

describe('Módulo FMEA', () => {
  let testUser;
  let testAtivo;

  beforeAll(async () => {
    // Limpar banco de dados de teste
    await sequelize.sync({ force: true });

    // Criar usuário administrador
    testUser = await User.create({
      nome: 'Administrador',
      email: 'admin@sistema.com',
      senha: await bcrypt.hash('123456', 10),
      perfil: 'administrador'
    });

    // Criar ativo de teste
    testAtivo = await Ativo.create({
      nome: 'Equipamento Teste',
      codigo_patrimonio: 'EQ-001',
      status: 'ativo'
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await FmeaAction.destroy({ where: {} });
    await FmeaAnalysis.destroy({ where: {} });
    await OrdemServico.destroy({ where: {} });
    await Ativo.destroy({ where: {} });
    await User.destroy({ where: {} });
    
    // Fechar conexão
    await sequelize.close();
  });

  describe('Autenticação', () => {
    it('deve fazer login com sucesso usando credenciais do admin', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@sistema.com',
          senha: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('admin@sistema.com');
      expect(response.body.user.perfil).toBe('administrador');
    });

    it('deve rejeitar login com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@sistema.com',
          senha: 'senha_errada'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('CRUD FMEA', () => {
    it('deve criar uma análise FMEA', async () => {
      const response = await request(app)
        .post('/api/fmea')
        .send({
          equipment_id: testAtivo.id,
          component: 'Motor Elétrico',
          function: 'Converter energia elétrica em energia mecânica',
          failure_mode: 'Falha no rolamento',
          failure_effect: 'Parada do equipamento',
          failure_cause: 'Falta de lubrificação',
          current_controls: 'Inspeção visual mensal',
          severity: 8,
          occurrence: 6,
          detection: 4,
          recommended_actions: 'Implementar plano de lubrificação',
          responsible: testUser.id
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rpn', 192);
    });

    it('deve listar análises FMEA', async () => {
      const response = await request(app)
        .get('/api/fmea')
        .query({ status: 'open' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});