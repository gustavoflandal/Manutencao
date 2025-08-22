const axios = require('axios');

async function testSetoresAPI() {
  try {
    console.log('1. Testando health check...');
    const health = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Health:', health.data);
    
    console.log('\n2. Testando login para obter token...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@sistema.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Falha no login:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado com sucesso');
    
    console.log('\n3. Testando endpoint de setores ativos...');
    const setoresResponse = await axios.get('http://localhost:3000/api/setores/ativos', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Setores ativos:', JSON.stringify(setoresResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testSetoresAPI();