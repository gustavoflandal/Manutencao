const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testarAPI() {
  try {
    console.log('🔐 Fazendo login...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sistema.com',
      senha: '123456'
    });
    
    const token = loginRes.data.data.accessToken;
    console.log('✅ Login realizado com sucesso');
    
    console.log('\n📋 Buscando ativos via API...');
    const ativosRes = await axios.get(`${API_BASE}/ativos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const ativos = ativosRes.data.data.ativos;
    console.log(`📊 Total de ativos retornados pela API: ${ativos.length}`);
    
    console.log('\n📋 Lista de ativos:');
    ativos.forEach(ativo => {
      console.log(`   - ID: ${ativo.id} | Código: ${ativo.codigo_patrimonio} | Nome: ${ativo.nome}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na API:', error.response?.data || error.message);
    process.exit(1);
  }
}

testarAPI();