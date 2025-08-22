
require('dotenv').config();

console.log('=== TESTE DE VARIAVEIS DE AMBIENTE ===\n');

console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
console.log('JWT_REFRESH_EXPIRES_IN:', process.env.JWT_REFRESH_EXPIRES_IN);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n=== TESTANDO AUTHSERVICE ===');
const AuthService = require('./services/AuthService');

console.log('AuthService.jwtSecret:', AuthService.jwtSecret);
console.log('AuthService.jwtExpiresIn:', AuthService.jwtExpiresIn);

console.log('\n=== TESTANDO CONFIG/AUTH ===');
const configAuth = require('./config/auth');

console.log('configAuth.JWT_SECRET:', configAuth.JWT_SECRET);
console.log('configAuth.JWT_EXPIRES_IN:', configAuth.JWT_EXPIRES_IN);

console.log('\n=== COMPARACAO ===');
console.log('Secrets iguais?', AuthService.jwtSecret === configAuth.JWT_SECRET);
