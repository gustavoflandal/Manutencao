// Mock dos controllers para testes
const AuthController = {
  register: (req, res) => {
    res.json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        id: 1,
        nome: req.body.nome,
        email: req.body.email,
        perfil: 'usuario'
      }
    });
  },

  publicRegister: (req, res) => {
    res.json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        id: 1,
        nome: req.body.nome,
        email: req.body.email,
        perfil: 'usuario'
      }
    });
  },

  login: (req, res) => {
    res.json({
      success: true,
      token: 'test-token',
      user: {
        id: 1,
        nome: 'Usuário Teste',
        email: 'teste@teste.com',
        perfil: 'administrador'
      }
    });
  },

  refreshToken: (req, res) => {
    res.json({
      success: true,
      token: 'new-test-token'
    });
  },

  logout: (req, res) => {
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  },

  verify: (req, res) => {
    res.json({
      success: true,
      user: req.user
    });
  },

  changePassword: (req, res) => {
    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  }
};

const FmeaController = {
  list: (req, res) => {
    res.json({
      success: true,
      data: []
    });
  },

  create: (req, res) => {
    res.json({
      success: true,
      data: {
        id: 1,
        ...req.body,
        rpn: req.body.severity * req.body.occurrence * req.body.detection
      }
    });
  },

  get: (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        component: 'Test Component',
        rpn: 192
      }
    });
  },

  update: (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        ...req.body
      }
    });
  },

  addAction: (req, res) => {
    res.json({
      success: true,
      data: {
        id: 1,
        ...req.body,
        new_rpn: req.body.new_severity * req.body.new_occurrence * req.body.new_detection
      }
    });
  },

  getCriticalAnalyses: (req, res) => {
    res.json({
      success: true,
      data: []
    });
  },

  getStatistics: (req, res) => {
    res.json({
      success: true,
      data: {
        total_analyses: 0,
        critical_analyses: 0,
        average_rpn: 0
      }
    });
  }
};

const OrdemServicoController = {
  create: (req, res) => {
    res.json({
      success: true,
      data: {
        id: 1,
        numero_os: 'OS-2024-000001',
        ...req.body
      }
    });
  }
};

module.exports = {
  AuthController,
  FmeaController,
  OrdemServicoController
};