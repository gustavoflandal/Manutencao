// Mock do middleware de autenticação para testes
const authMock = (req, res, next) => {
  // Simula um usuário autenticado
  req.user = {
    id: 1,
    nome: 'Usuário Teste',
    email: 'teste@teste.com',
    perfil: 'administrador'
  };
  next();
};

module.exports = authMock;
