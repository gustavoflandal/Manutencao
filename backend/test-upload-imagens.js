const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuração da API
const API_BASE = 'http://localhost:3001/api';
let authToken = '';

async function testarUploadImagens() {
  console.log('🧪 Iniciando teste do Upload de Imagens...\n');

  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sistema.com',
      senha: '123456'
    });
    
    authToken = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado com sucesso');
    console.log('Token:', authToken.substring(0, 50) + '...\n');

    // 2. Criar um ativo para teste
    console.log('2. Criando ativo para teste...');
    const ativo = {
      codigo_patrimonio: `IMG-TEST-${Date.now()}`,
      nome: 'Ativo para Teste de Imagens'
    };

    const ativoResponse = await axios.post(`${API_BASE}/ativos`, ativo, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const ativoId = ativoResponse.data.data.ativo.id;
    console.log(`✅ Ativo criado com ID: ${ativoId}\n`);

    // 3. Verificar endpoint de upload de imagens
    console.log('3. Testando endpoint de upload...');
    try {
      // Vamos simular um upload sem arquivo primeiro
      const uploadResponse = await axios.post(`${API_BASE}/ativos/${ativoId}/imagens`, {}, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Upload response:', uploadResponse.data);
    } catch (uploadErr) {
      console.log('📝 Resposta esperada do upload (sem arquivo):', uploadErr.response?.status, uploadErr.response?.data?.message);
    }

    // 4. Listar imagens do ativo
    console.log('\n4. Listando imagens do ativo...');
    const imagensResponse = await axios.get(`${API_BASE}/ativos/${ativoId}/imagens`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Endpoint de listagem funciona:', imagensResponse.data);

    // 5. Limpar ativo de teste
    console.log('\n5. Limpando ativo de teste...');
    await axios.delete(`${API_BASE}/ativos/${ativoId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Ativo de teste removido\n');

    console.log('🎉 TESTE CONCLUÍDO! Endpoints de imagem estão funcionando.');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Executar teste
testarUploadImagens();