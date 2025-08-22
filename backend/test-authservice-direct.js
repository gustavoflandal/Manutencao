
const AuthService = require('./services/AuthService');

console.log('=== TESTE DIRETO DO AUTHSERVICE ===\n');

// Dados de teste
const tokenData = {
  id: 1,
  email: 'admin@sistema.com',
  perfil: 'administrador'
};

try {
  console.log('1. Gerando token...');
  const token = AuthService.generateAccessToken(tokenData);
  console.log('Token gerado:', token ? 'SUCESSO' : 'FALHA');
  console.log('Token:', token.substring(0, 50) + '...');
  
  console.log('\n2. Verificando o mesmo token...');
  const decoded = AuthService.verifyAccessToken(token);
  console.log('Verificacao:', decoded ? 'SUCESSO' : 'FALHA');
  console.log('Dados decodificados:', JSON.stringify(decoded, null, 2));
  
  console.log('\nAUTHSERVICE FUNCIONANDO CORRETAMENTE!');
  
} catch (error) {
  console.error('ERRO NO AUTHSERVICE:', error.message);
  console.error('Stack:', error.stack);
}
