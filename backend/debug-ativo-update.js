const axios = require('axios');

// Configuração da API
const API_BASE = 'http://localhost:3001/api';
let authToken = '';

async function debugAtivoUpdate() {
  console.log('🔍 Debugando erro de atualização de ativo...\n');

  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sistema.com',
      senha: '123456'
    });
    
    authToken = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado com sucesso\n');

    // 2. Buscar ativo com ID 9
    console.log('2. Buscando ativo com ID 9...');
    const ativoResponse = await axios.get(`${API_BASE}/ativos/9`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const ativo = ativoResponse.data.data.ativo;
    console.log('✅ Ativo encontrado:');
    console.log('   Código:', ativo.codigo_patrimonio);
    console.log('   Nome:', ativo.nome);
    console.log('   Estado:', ativo.estado);
    console.log('   Criticidade:', ativo.criticidade);
    console.log('   Department ID:', ativo.department_id);
    console.log('   Categoria ID:', ativo.categoria_id);
    console.log('   Setor ID:', ativo.setor_id);
    console.log('   Responsável ID:', ativo.responsavel_id);

    // 3. Tentar atualização simples
    console.log('\n3. Tentando atualização simples...');
    const updateData = {
      codigo_patrimonio: ativo.codigo_patrimonio,
      nome: ativo.nome + ' - Teste Update',
      estado: ativo.estado,
      criticidade: ativo.criticidade,
      department_id: ativo.department_id || 1
    };

    console.log('Dados de atualização:', updateData);

    try {
      const updateResponse = await axios.put(`${API_BASE}/ativos/9`, updateData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Atualização bem-sucedida:', updateResponse.data);
    } catch (updateError) {
      console.log('❌ Erro na atualização:', updateError.response?.status);
      console.log('Mensagem:', updateError.response?.data);
      
      // Vamos tentar com dados ainda mais básicos
      console.log('\n4. Tentando com dados mínimos...');
      const minimalData = {
        codigo_patrimonio: ativo.codigo_patrimonio,
        nome: ativo.nome
      };
      
      try {
        const minimalResponse = await axios.put(`${API_BASE}/ativos/9`, minimalData, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Atualização mínima bem-sucedida:', minimalResponse.data);
      } catch (minimalError) {
        console.log('❌ Erro na atualização mínima:', minimalError.response?.status);
        console.log('Detalhes do erro:', JSON.stringify(minimalError.response?.data, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

// Executar debug
debugAtivoUpdate();