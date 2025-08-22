
const AuthService = require('./services/AuthService');

console.log('=== TESTE DEBUG MIDDLEWARE ===\n');

// Simular exatamente o que o middleware faz
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBzaXN0ZW1hLmNvbSIsInBlcmZpbCI6ImFkbWluaXN0cmFkb3IiLCJpYXQiOjE3NTU5MDMwODcsImV4cCI6MTc1NTkwNjY4NywiYXVkIjoic2lzdGVtYS1tYW51dGVuY2FvLXVzZXJzIiwiaXNzIjoic2lzdGVtYS1tYW51dGVuY2FvIn0.47ZmndK-pQwcu7ch73UejGpnBWhPlTed-wXmbQqPBps';

console.log('1. Token de teste (mesmo que foi rejeitado):');
console.log(token.substring(0, 100) + '...');

try {
  console.log('\n2. Testando AuthService.verifyAccessToken...');
  const decoded = AuthService.verifyAccessToken(token);
  console.log('SUCESSO! Dados decodificados:');
  console.log(JSON.stringify(decoded, null, 2));
  
  console.log('\n3. Verificando se AuthService é a mesma instancia...');
  console.log('AuthService instance:', typeof AuthService);
  console.log('verifyAccessToken method:', typeof AuthService.verifyAccessToken);
  
} catch (error) {
  console.error('ERRO ao verificar token:', error.message);
  console.error('Tipo do erro:', error.name);
  console.error('Stack completo:', error.stack);
}
