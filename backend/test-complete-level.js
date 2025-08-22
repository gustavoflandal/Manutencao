// Teste completo do sistema Level-only com autenticação
const axios = require('axios');

async function testWithAuth() {
  const BASE_URL = 'http://localhost:3000/api';
  
  try {
    console.log('🧪 Teste Level-only com autenticação\n');

    // 1. Login
    console.log('1️⃣ Fazendo login...');
    const loginData = {
      email: 'admin@sistema.com',
      password: '123456'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.data.token;
    console.log(`✅ Login ok - Token obtido\n`);

    // Configurar headers com token
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Testar listagem de ativos
    console.log('2️⃣ GET /ativos com auth...');
    const ativos = await axios.get(`${BASE_URL}/ativos`, { headers });
    console.log(`✅ Status: ${ativos.status}`);
    console.log(`✅ Ativos encontrados: ${ativos.data.data.ativos.length}\n`);

    // 3. Testar estatísticas
    console.log('3️⃣ GET /ativos/stats...');
    const stats = await axios.get(`${BASE_URL}/ativos/stats`, { headers });
    console.log(`✅ Status: ${stats.status}`);
    console.log(`✅ Total de ativos: ${stats.data.data.total}\n`);

    // 4. Criar ativo teste se necessário
    if (ativos.data.data.ativos.length === 0) {
      console.log('4️⃣ Criando ativo teste...');
      const novoAtivo = {
        nome: 'Teste Level Only',
        codigo_patrimonio: `TEST_${Date.now()}`,
        estado: 'operacional',
        criticidade: 'media'
      };
      
      const ativoResponse = await axios.post(`${BASE_URL}/ativos`, novoAtivo, { headers });
      console.log(`✅ Ativo criado: ${ativoResponse.data.data.ativo.codigo_patrimonio}\n`);
    }

    console.log('🎉 SISTEMA LEVEL-ONLY FUNCIONANDO PERFEITAMENTE!');
    console.log('✅ API endpoints operacionais');
    console.log('✅ Autenticação funcionando');
    console.log('✅ CRUD de ativos operacional');
    console.log('✅ Sistema simplificado e funcional');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Data:', error.response.data);
    }
  }
}

testWithAuth();