// Teste rápido da API Level-only
const axios = require('axios');

async function testAPIQuick() {
  const BASE_URL = 'http://localhost:3000/api';
  
  try {
    console.log('🧪 Testando API Level-only...\n');

    // 1. Testar listar ativos
    console.log('1️⃣ GET /ativos...');
    const ativos = await axios.get(`${BASE_URL}/ativos`);
    console.log(`✅ Status: ${ativos.status}`);
    console.log(`✅ Ativos: ${ativos.data.data.ativos.length}\n`);

    // 2. Testar stats
    console.log('2️⃣ GET /ativos/stats...');
    const stats = await axios.get(`${BASE_URL}/ativos/stats`);
    console.log(`✅ Status: ${stats.status}`);
    console.log(`✅ Total: ${stats.data.data.total}\n`);

    console.log('🎉 API Level-only funcionando!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Data:', error.response.data);
    }
  }
}

testAPIQuick();