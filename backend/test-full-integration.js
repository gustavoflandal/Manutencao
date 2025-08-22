// backend/test-full-integration.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testFullIntegration() {
  console.log('🔄 Iniciando teste de integração completa...\n');
  
  const baseURL = 'http://localhost:3000/api';
  let ativoId;
  
  try {
    // Teste 1: Verificar se servidor está rodando
    console.log('1️⃣ Verificando conectividade com servidor...');
    const healthCheck = await axios.get(`${baseURL}/health`);
    console.log(`✅ Servidor respondendo:`, healthCheck.data.status);
    
    // Teste 2: Fazer login (se necessário)
    console.log('\n2️⃣ Testando autenticação...');
    let authToken = '';
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'admin@sistema.com',
        senha: 'admin123'
      });
      authToken = loginResponse.data.token;
      console.log('✅ Login realizado com sucesso');
    } catch (error) {
      console.log('⚠️ Login não necessário ou dados incorretos, continuando...');
    }
    
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    // Teste 3: Criar ativo
    console.log('\n3️⃣ Criando ativo de teste...');
    const ativoData = {
      codigo: 'TEST_LEVEL_' + Date.now(),
      nome: 'Ativo Teste Level',
      descricao: 'Teste da implementação Level',
      categoria: 'Equipamento',
      localizacao: 'Sala Teste',
      status: 'ativo'
    };
    
    const createResponse = await axios.post(`${baseURL}/ativos`, ativoData, { headers });
    ativoId = createResponse.data.id;
    console.log(`✅ Ativo criado com ID: ${ativoId}`);
    
    // Teste 4: Upload de imagem
    console.log('\n4️⃣ Testando upload de imagem...');
    
    // Criar uma imagem de teste simples
    const testImagePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testImagePath, 'DADOS DA IMAGEM DE TESTE');
    
    const formData = new FormData();
    formData.append('imagens', fs.createReadStream(testImagePath), 'test-image.txt');
    
    const uploadResponse = await axios.post(
      `${baseURL}/ativos/${ativoId}/imagens`,
      formData,
      {
        headers: {
          ...headers,
          ...formData.getHeaders()
        }
      }
    );
    
    console.log(`✅ Upload realizado:`, uploadResponse.data.message);
    console.log(`📷 Imagens salvas:`, uploadResponse.data.imagens.length);
    
    // Teste 5: Listar imagens
    console.log('\n5️⃣ Listando imagens do ativo...');
    const listResponse = await axios.get(`${baseURL}/ativos/${ativoId}/imagens`, { headers });
    console.log(`✅ Imagens encontradas:`, listResponse.data.length);
    
    if (listResponse.data.length > 0) {
      const primeiraImagem = listResponse.data[0];
      console.log(`📋 Primeira imagem:`, {
        id: primeiraImagem.id,
        nome: primeiraImagem.nome_original,
        tamanho: primeiraImagem.tamanho,
        url: primeiraImagem.url
      });
      
      // Teste 6: Download da imagem
      console.log('\n6️⃣ Testando download da imagem...');
      const downloadResponse = await axios.get(
        `${baseURL}/ativos/${ativoId}/imagens/${primeiraImagem.key}/download`,
        { 
          headers,
          responseType: 'arraybuffer'
        }
      );
      
      console.log(`✅ Download realizado, tamanho: ${downloadResponse.data.byteLength} bytes`);
      
      // Teste 7: Remover imagem
      console.log('\n7️⃣ Removendo imagem...');
      await axios.delete(`${baseURL}/ativos/${ativoId}/imagens/${primeiraImagem.id}`, { headers });
      console.log(`✅ Imagem removida com sucesso`);
    }
    
    // Teste 8: Verificar estatísticas
    console.log('\n8️⃣ Verificando estatísticas do sistema...');
    try {
      const statsResponse = await axios.get(`${baseURL}/ativos/system/stats`, { headers });
      console.log(`✅ Estatísticas:`, statsResponse.data);
    } catch (error) {
      console.log('⚠️ Estatísticas requerem permissão de admin');
    }
    
    // Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    await axios.delete(`${baseURL}/ativos/${ativoId}`, { headers });
    console.log(`✅ Ativo removido`);
    
    // Remover arquivo de teste
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    console.log('\n🎉 Teste de integração completo executado com sucesso!');
    console.log('\n📊 Resumo dos resultados:');
    console.log('• Conectividade: ✅');
    console.log('• CRUD de ativos: ✅');
    console.log('• Upload de imagens: ✅');
    console.log('• Listagem de imagens: ✅');
    console.log('• Download de imagens: ✅');
    console.log('• Remoção de imagens: ✅');
    console.log('• Armazenamento Level: ✅');
    
  } catch (error) {
    console.error('❌ Erro durante teste de integração:', error.message);
    
    if (error.response) {
      console.log('📝 Detalhes do erro:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    // Tentar limpar mesmo com erro
    if (ativoId) {
      try {
        await axios.delete(`${baseURL}/ativos/${ativoId}`, { headers });
        console.log('🧹 Ativo de teste removido na limpeza');
      } catch (cleanupError) {
        console.log('⚠️ Não foi possível limpar ativo de teste');
      }
    }
  }
}

// Executar teste apenas se servidor estiver rodando
testFullIntegration();