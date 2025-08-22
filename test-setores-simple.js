// Teste simples para verificar API de setores
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('1. Testando login...');
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = {
      email: 'admin@sistema.com',
      senha: '123456'
    };
    
    const loginResult = await makeRequest(loginOptions, loginData);
    console.log('Login result:', loginResult);
    
    if (!loginResult.success) {
      console.log('❌ Falha no login');
      return;
    }
    
    const token = loginResult.data.accessToken;
    console.log('✅ Token obtido');
    
    console.log('\n2. Testando setores ativos...');
    
    const setoresOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/setores/ativos',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const setoresResult = await makeRequest(setoresOptions);
    console.log('Setores result:', JSON.stringify(setoresResult, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testAPI();