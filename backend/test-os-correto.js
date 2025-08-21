const axios = require('axios');

async function testOS() {
  try {
    console.log('1. 🔐 Login com campo correto...');
    const login = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@sistema.com',
      senha: '123456'  // Campo correto
    });
    
    console.log('✅ Login OK');
    const token = login.data.data.accessToken;

    console.log('2. 📋 Testando Ordens de Serviço...');
    const os = await axios.get('http://localhost:3001/api/ordens-servico', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Ordens de Serviço OK:', os.data.data?.ordensServico?.length || 0);
    console.log('   📊 Status:', os.status);

  } catch(e) {
    console.log('❌ Erro:', e.response?.data || e.message);
  }
}

testOS();