// Teste do CRUD de Ativos
// Este arquivo testa a criação, edição e visualização de ativos

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testCRUDAtivos() {
  console.log('🧪 Iniciando teste do CRUD de Ativos...\n');

  try {
    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sistema.com',
      senha: '123456'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado com sucesso\n');

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // 2. Verificar setores disponíveis
    console.log('2. Verificando setores...');
    const setoresResponse = await axios.get(`${API_BASE}/setores`, config);
    const setores = setoresResponse.data.data.setores;
    console.log(`✅ Setores encontrados: ${setores.length}`);
    if (setores.length > 0) {
      console.log(`   Primeiro setor: ID ${setores[0].id} - ${setores[0].nome}`);
    }

    const setorId = setores.length > 0 ? setores[0].id : null;

    // 3. Criar um novo ativo
    console.log('3. Criando novo ativo...');
    const novoAtivo = {
      codigo_patrimonio: `TEST-${Date.now()}`,
      nome: 'Ativo de Teste',
      estado: 'operacional',
      criticidade: 'media',
      setor_id: setorId,
      localizacao_completa: 'Setor de Teste - Linha 1 - Posição 1',
      observacoes: 'Este é um ativo criado para teste do CRUD'
    };

    const createResponse = await axios.post(`${API_BASE}/ativos`, novoAtivo, config);
    const ativo = createResponse.data.data.ativo;
    const ativoId = ativo.id;
    console.log(`✅ Ativo criado com ID: ${ativoId}`);
    console.log(`   Código: ${ativo.codigo_patrimonio}`);
    console.log(`   Localização: ${ativo.localizacao_completa}`);
    console.log(`   Observações: ${ativo.observacoes}\n`);

    // 4. Listar ativos para verificar se foi criado
    console.log('4. Listando ativos...');
    const listResponse = await axios.get(`${API_BASE}/ativos`, config);
    const ativos = listResponse.data.data.ativos;
    const ativoEncontrado = ativos.find(a => a.id === ativoId);
    console.log(`✅ Ativo encontrado na listagem: ${ativoEncontrado ? 'SIM' : 'NÃO'}\n`);

    // 4. Buscar ativo específico
    console.log('4. Buscando ativo específico...');
    const getResponse = await axios.get(`${API_BASE}/ativos/${ativoId}`, config);
    console.log(`✅ Ativo recuperado: ${getResponse.data.nome}`);
    console.log(`   Localização: ${getResponse.data.localizacao_completa}`);
    console.log(`   Observações: ${getResponse.data.observacoes}\n`);

    // 5. Atualizar ativo
    console.log('5. Atualizando ativo...');
    const ativoAtualizado = {
      ...novoAtivo,
      nome: 'Ativo de Teste - ATUALIZADO',
      localizacao_completa: 'Setor de Teste - Linha 2 - Posição 5',
      observacoes: 'Ativo atualizado com sucesso no teste do CRUD'
    };

    const updateResponse = await axios.put(`${API_BASE}/ativos/${ativoId}`, ativoAtualizado, config);
    console.log(`✅ Ativo atualizado: ${updateResponse.data.nome}`);
    console.log(`   Nova localização: ${updateResponse.data.localizacao_completa}`);
    console.log(`   Novas observações: ${updateResponse.data.observacoes}\n`);

    // 6. Verificar se a atualização foi persistida
    console.log('6. Verificando atualização...');
    const verifyResponse = await axios.get(`${API_BASE}/ativos/${ativoId}`, config);
    console.log(`✅ Verificação: Nome = ${verifyResponse.data.nome}`);
    console.log(`   Localização = ${verifyResponse.data.localizacao_completa}`);
    console.log(`   Observações = ${verifyResponse.data.observacoes}\n`);

    // 7. Limpar - excluir ativo de teste
    console.log('7. Limpando ativo de teste...');
    await axios.delete(`${API_BASE}/ativos/${ativoId}`, config);
    console.log('✅ Ativo de teste excluído\n');

    console.log('🎉 TODOS OS TESTES PASSARAM! O CRUD está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Dica: Verifique se o token de autenticação está válido');
    }
    
    if (error.response?.status === 500) {
      console.log('💡 Dica: Verifique se o banco de dados está rodando e as tabelas existem');
    }
  }
}

// Executar teste
testCRUDAtivos();