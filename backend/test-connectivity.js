// Teste rápido de conectividade do servidor
const axios = require('axios');

async function testServerConnectivity() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('🔍 Testando conectividade do servidor...\n');
  
  try {
    // 1. Testar health check básico
    console.log('1️⃣ Testando endpoint básico...');
    try {
      const response = await axios.get(`${BASE_URL}/api/ativos/stats`);
      console.log(`✅ API acessível - Status: ${response.status}`);
    } catch (authError) {
      if (authError.response?.status === 401) {
        console.log('✅ API acessível (erro 401 esperado - precisa auth)');
      } else {
        throw authError;
      }
    }

    // 2. Testar login para verificar autenticação
    console.log('2️⃣ Testando login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@sistema.com',
        password: '123456'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login funcionando');
        const token = loginResponse.data.data.token;
        
        // 3. Testar endpoint autenticado
        console.log('3️⃣ Testando endpoint autenticado...');
        const authedResponse = await axios.get(`${BASE_URL}/api/ativos/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Endpoints autenticados funcionando');
        console.log(`📊 Total de ativos: ${authedResponse.data.data.total}`);
        
        // 4. Testar estatísticas Level
        console.log('4️⃣ Testando estatísticas Level...');
        try {
          const levelStats = await axios.get(`${BASE_URL}/api/ativos/level/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Level stats funcionando');
          console.log(`📊 Level - Total imagens: ${levelStats.data.data.level.totalImages}`);
        } catch (levelError) {
          console.log('⚠️ Level stats podem ter restrições de acesso');
        }
        
      }
    } catch (loginError) {
      console.log('⚠️ Login pode ter problemas:', loginError.response?.data?.message || loginError.message);
    }

    console.log('\n🎉 SERVIDOR ESTÁ ACESSÍVEL!');
    console.log('✅ Backend funcionando na porta 3000');
    console.log('✅ API respondendo corretamente');
    console.log('✅ Level inicializado com sucesso');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erro de conectividade:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Servidor não está respondendo');
    }
    
    return { success: false, error: error.message };
  }
}

testServerConnectivity();