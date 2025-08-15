const http = require('http');

// Dados do administrador
const adminData = {
  nome: 'Administrador Sistema',
  email: 'admin@sistema.com',
  senha: '123456'
};

// Configuração da requisição
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🔧 Criando usuário administrador...');
console.log('📧 Email:', adminData.email);
console.log('🔑 Senha:', adminData.senha);
console.log('');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 201) {
        console.log('✅ Usuário administrador criado com sucesso!');
        console.log('');
        console.log('📋 Dados para login:');
        console.log('   Email: admin@sistema.com');
        console.log('   Senha: 123456');
        console.log('');
        console.log('🌐 Acesse o sistema em: http://localhost:3002');
        console.log('');
        console.log('👤 Perfil:', response.data?.user?.perfil || 'administrador');
      } else {
        console.log('⚠️ Resposta do servidor:', res.statusCode);
        console.log('📄 Mensagem:', response.message || 'Erro desconhecido');
        
        if (response.message && response.message.includes('já está em uso')) {
          console.log('');
          console.log('ℹ️ O usuário administrador já existe!');
          console.log('📋 Use as credenciais:');
          console.log('   Email: admin@sistema.com');
          console.log('   Senha: 123456');
          console.log('');
          console.log('🌐 Acesse: http://localhost:3002');
        }
      }
    } catch (error) {
      console.log('❌ Erro ao processar resposta:', error.message);
      console.log('📄 Resposta bruta:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Erro na conexão:', error.message);
  console.log('');
  console.log('🔍 Verifique se o backend está rodando em http://localhost:3001');
  console.log('💡 Execute: cd backend && npm start');
});

// Enviar dados
req.write(JSON.stringify(adminData));
req.end();
