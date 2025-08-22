// Mock dos middlewares para testes
const authenticate = (req, res, next) => {
  req.user = {
    id: 1,
    nome: 'Usuário Teste',
    email: 'teste@teste.com',
    perfil: 'administrador'
  };
  next();
};

const checkPermission = (permission) => (req, res, next) => {
  next();
};

module.exports = {
  authenticate,
  checkPermission
};
