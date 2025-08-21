const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing with "senha"...');
    const r1 = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@sistema.com',
      senha: '123456'  // Usando 'senha' em vez de 'password'
    });
    console.log('Senha result:', r1.data);
  } catch(e) {
    console.log('Senha error:', e.response?.data || e.message);
  }

  try {
    console.log('Testing with "password"...');
    const r2 = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@sistema.com',
      password: '123456'  // Usando 'password'
    });
    console.log('Password result:', r2.data);
  } catch(e) {
    console.log('Password error:', e.response?.data || e.message);
  }
}

testLogin();