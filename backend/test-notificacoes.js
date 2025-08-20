const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testarNotificacoes() {
  try {
    console.log('🧪 Testando API de Notificações...\n');

    // Primeiro fazer login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@sistema.com',
      senha: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Testar contagem de notificações não lidas
    console.log('2. Testando contagem de notificações não lidas...');
    const countResponse = await axios.get(`${baseURL}/notificacoes/contar-nao-lidas`, { headers });
    console.log('✅ Contagem:', countResponse.data);
    console.log('');

    // Testar obtenção de configurações
    console.log('3. Testando configurações de notificação...');
    const configResponse = await axios.get(`${baseURL}/notificacoes/configuracoes`, { headers });
    console.log('✅ Configurações obtidas:', configResponse.data ? 'Sim' : 'Não');
    console.log('');

    // Testar criação de notificação de teste
    console.log('4. Testando criação de notificação...');
    const createResponse = await axios.post(`${baseURL}/notificacoes/teste`, {
      tipo: 'sistema',
      user_id: null // Global
    }, { headers });
    console.log('✅ Notificação de teste criada:', createResponse.data.message);
    console.log('');

    // Testar listagem de notificações
    console.log('5. Testando listagem de notificações...');
    const listResponse = await axios.get(`${baseURL}/notificacoes`, { headers });
    console.log('✅ Notificações listadas:', listResponse.data.notificacoes.length, 'itens');
    console.log('');

    // Testar estatísticas
    console.log('6. Testando estatísticas...');
    const statsResponse = await axios.get(`${baseURL}/notificacoes/estatisticas`, { headers });
    console.log('✅ Estatísticas:', statsResponse.data);
    console.log('');

    console.log('🎉 Todos os testes de notificação passaram com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Aguardar um pouco para o servidor inicializar completamente
setTimeout(testarNotificacoes, 2000);