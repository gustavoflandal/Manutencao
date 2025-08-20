const axios = require('axios');

async function testeConexao() {
  try {
    console.log('🔍 Testando conexão com o servidor...');
    
    const response = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Servidor respondeu:', response.data);
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.code || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 O servidor não está respondendo na porta 3001');
      console.log('💡 Verifique se o processo está rodando');
    }
  }
}

testeConexao();