#!/usr/bin/env node

/**
 * Script para testar se os principais erros foram corrigidos
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testarCorreções() {
  console.log('🧪 Testando correções de erros...\n');

  try {
    // 1. Teste de login para obter token
    console.log('1. 🔐 Testando login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sistema.com',
      password: '123456'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login bem-sucedido');
      var token = loginResponse.data.token;
      var authHeaders = { 'Authorization': `Bearer ${token}` };
    } else {
      console.log('❌ Falha no login');
      return;
    }

    // 2. Teste de listagem de fornecedores (erro: Unknown column 'Fornecedor.nome')
    console.log('\n2. 📦 Testando listagem de fornecedores...');
    try {
      const fornecedoresResponse = await axios.get(`${API_BASE}/estoque/fornecedores`, {
        headers: authHeaders
      });
      console.log('✅ Fornecedores listados com sucesso');
    } catch (error) {
      console.log('❌ Erro ao listar fornecedores:', error.response?.data?.message || error.message);
    }

    // 3. Teste de listagem de itens de estoque (erro: alias 'fornecedor' vs 'fornecedor_principal')
    console.log('\n3. 📋 Testando listagem de itens de estoque...');
    try {
      const itensResponse = await axios.get(`${API_BASE}/estoque/itens`, {
        headers: authHeaders
      });
      console.log('✅ Itens de estoque listados com sucesso');
    } catch (error) {
      console.log('❌ Erro ao listar itens:', error.response?.data?.message || error.message);
    }

    // 4. Teste de alertas de estoque (erro: ItemEstoque.itensBaixoEstoque is not a function)
    console.log('\n4. ⚠️ Testando alertas de estoque...');
    try {
      const alertasResponse = await axios.get(`${API_BASE}/estoque/alertas`, {
        headers: authHeaders
      });
      console.log('✅ Alertas de estoque obtidos com sucesso');
    } catch (error) {
      console.log('❌ Erro ao obter alertas:', error.response?.data?.message || error.message);
    }

    // 5. Teste de listagem de workflows (erro: include.model.getTableName is not a function)
    console.log('\n5. 🔄 Testando listagem de workflows...');
    try {
      const workflowsResponse = await axios.get(`${API_BASE}/workflows`, {
        headers: authHeaders
      });
      console.log('✅ Workflows listados com sucesso');
    } catch (error) {
      console.log('❌ Erro ao listar workflows:', error.response?.data?.message || error.message);
    }

    // 6. Teste de atualização de ativo com categoria_id vazia
    console.log('\n6. ✏️ Testando atualização de ativo com categoria vazia...');
    try {
      // Primeiro, criar um ativo de teste
      const novoAtivo = await axios.post(`${API_BASE}/ativos`, {
        nome: 'Teste Correção',
        descricao: 'Ativo para testar correção de categoria vazia',
        categoria_id: null
      }, { headers: authHeaders });

      if (novoAtivo.data.success) {
        const ativoId = novoAtivo.data.data.ativo.id;
        
        // Tentar atualizar com categoria_id vazia (string)
        const updateResponse = await axios.put(`${API_BASE}/ativos/${ativoId}`, {
          nome: 'Teste Correção Atualizado',
          categoria_id: '',  // String vazia que causava erro
          subcategoria_id: ''
        }, { headers: authHeaders });

        if (updateResponse.data.success) {
          console.log('✅ Ativo atualizado com categoria vazia (corrigido)');
        } else {
          console.log('❌ Falha na atualização:', updateResponse.data.message);
        }

        // Limpar o ativo de teste
        await axios.delete(`${API_BASE}/ativos/${ativoId}`, { headers: authHeaders });
      }
    } catch (error) {
      console.log('❌ Erro no teste de atualização:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Teste de correções concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data?.message || error.message);
  }
}

// Aguardar servidor inicializar
console.log('⏳ Aguardando servidor inicializar...');
setTimeout(testarCorreções, 5000);