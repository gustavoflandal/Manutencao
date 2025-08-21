#!/usr/bin/env node

/**
 * Script para testar os erros específicos que foram corrigidos
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testarEspecificos() {
  console.log('🧪 Testando correções específicas...\n');

  try {
    // 1. Login
    console.log('1. 🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sistema.com',
      password: '123456'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Falha no login');
      return;
    }

    console.log('✅ Login bem-sucedido');
    const authHeaders = { 'Authorization': `Bearer ${loginResponse.data.token}` };

    // 2. Teste de listagem de workflows (erro: criador.name)
    console.log('\n2. 🔄 Testando listagem de workflows...');
    try {
      const workflowsResponse = await axios.get(`${API_BASE}/workflows`, {
        headers: authHeaders
      });
      console.log('✅ Workflows listados com sucesso');
      console.log(`   📊 Total: ${workflowsResponse.data.data?.workflows?.length || 0} workflows encontrados`);
    } catch (error) {
      console.log('❌ Erro ao listar workflows:', error.response?.data?.message || error.message);
      if (error.response?.data?.error?.includes('name')) {
        console.log('   🔍 Ainda há problema com campo "name" vs "nome"');
      }
    }

    // 3. Teste de listagem de ordens de serviço (erro: setor_id)
    console.log('\n3. 🔧 Testando listagem de ordens de serviço...');
    try {
      const osResponse = await axios.get(`${API_BASE}/ordens-servico`, {
        headers: authHeaders
      });
      console.log('✅ Ordens de serviço listadas com sucesso');
      console.log(`   📊 Total: ${osResponse.data.data?.ordensServico?.length || 0} OS encontradas`);
    } catch (error) {
      console.log('❌ Erro ao listar ordens de serviço:', error.response?.data?.message || error.message);
      if (error.response?.data?.error?.includes('setor_id')) {
        console.log('   🔍 Ainda há problema com campo "setor_id"');
      }
    }

    // 4. Teste de relatório de produtividade (erro: setor_id)
    console.log('\n4. 📈 Testando relatório de produtividade...');
    try {
      const relatorioResponse = await axios.get(`${API_BASE}/ordens-servico/relatorio/produtividade`, {
        headers: authHeaders
      });
      console.log('✅ Relatório de produtividade gerado com sucesso');
    } catch (error) {
      console.log('❌ Erro no relatório de produtividade:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Teste específico de correções concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data?.message || error.message);
  }
}

// Aguardar servidor inicializar
console.log('⏳ Aguardando servidor inicializar...');
setTimeout(testarEspecificos, 8000);