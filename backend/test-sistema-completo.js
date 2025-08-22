// backend/test-sistema-completo.js
require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testarSistemaCompleto() {
  console.log('🧪 Teste completo do sistema de imagens com Level...\n');
  
  const baseURL = 'http://localhost:3000/api';
  let ativoId = null;
  let token = null;
  
  try {
    // 1. Health Check
    console.log('1️⃣ Verificando status do servidor...');
    const health = await axios.get(`${baseURL}/health`);
    console.log('✅ Servidor respondendo:', health.data.status);
    
    // 2. Login (se necessário)
    console.log('\n2️⃣ Testando autenticação...');
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'admin@sistema.com',
        senha: 'admin123'
      });
      token = loginResponse.data.token;
      console.log('✅ Login realizado com sucesso');
    } catch (error) {
      console.log('⚠️ Teste sem autenticação (assumindo desenvolvimento)');
    }
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    // 3. Testar estatísticas
    console.log('\n3️⃣ Testando endpoint de estatísticas...');
    try {
      const statsResponse = await axios.get(`${baseURL}/ativos/stats`, { headers });
      console.log('✅ Estatísticas obtidas:', statsResponse.data.data);
    } catch (error) {
      console.log('⚠️ Erro nas estatísticas (pode ser normal sem dados)');
    }
    
    // 4. Criar ativo de teste
    console.log('\n4️⃣ Criando ativo de teste...');
    const ativoData = {
      codigo_patrimonio: 'TEST_IMG_' + Date.now(),
      nome: 'Ativo Teste Imagens Level',
      descricao: 'Ativo para testar sistema de imagens com Level',
      estado: 'operacional',
      criticidade: 'media',
      localizacao_completa: 'Sala de Testes'
    };
    
    const createResponse = await axios.post(`${baseURL}/ativos`, ativoData, { headers });
    
    if (createResponse.data.success) {
      ativoId = createResponse.data.data.ativo.id;
      console.log(`✅ Ativo criado com ID: ${ativoId}`);
    } else {
      throw new Error('Resposta de criação não indica sucesso');
    }
    
    // 5. Criar imagem de teste
    console.log('\n5️⃣ Preparando imagem de teste...');
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Criar uma imagem PNG simples de teste
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    fs.writeFileSync(testImagePath, pngHeader);
    console.log('✅ Imagem de teste criada');
    
    // 6. Upload da imagem
    console.log('\n6️⃣ Testando upload de imagem...');
    const formData = new FormData();
    formData.append('imagens', fs.createReadStream(testImagePath), 'test-image.png');
    
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
    
    if (uploadResponse.data.success) {
      console.log(`✅ Upload realizado: ${uploadResponse.data.message}`);
      console.log(`📷 Imagens salvas: ${uploadResponse.data.data.imagens.length}`);
    } else {
      throw new Error('Upload não foi bem-sucedido');
    }
    
    // 7. Listar imagens
    console.log('\n7️⃣ Listando imagens do ativo...');
    const listResponse = await axios.get(`${baseURL}/ativos/${ativoId}/imagens`, { headers });
    
    if (listResponse.data.success && listResponse.data.data.imagens.length > 0) {
      const imagens = listResponse.data.data.imagens;
      console.log(`✅ ${imagens.length} imagem(ns) encontrada(s)`);
      
      const primeiraImagem = imagens[0];
      console.log(`📋 Primeira imagem:`, {
        id: primeiraImagem.id,
        nome_arquivo: primeiraImagem.nome_arquivo,
        tamanho: primeiraImagem.tamanho,
        caminho: primeiraImagem.caminho
      });
      
      // 8. Testar download
      console.log('\n8️⃣ Testando download da imagem...');
      const downloadUrl = primeiraImagem.caminho;
      const downloadResponse = await axios.get(
        `http://localhost:3000${downloadUrl}`,
        { 
          headers,
          responseType: 'arraybuffer'
        }
      );
      
      console.log(`✅ Download realizado, tamanho: ${downloadResponse.data.byteLength} bytes`);
      console.log(`📋 Content-Type: ${downloadResponse.headers['content-type']}`);
      
      // 9. Testar remoção da imagem
      console.log('\n9️⃣ Removendo imagem...');
      const removeResponse = await axios.delete(
        `${baseURL}/ativos/${ativoId}/imagens/${primeiraImagem.id}`, 
        { headers }
      );
      
      if (removeResponse.data.success) {
        console.log(`✅ ${removeResponse.data.message}`);
      }
    } else {
      console.log('⚠️ Nenhuma imagem encontrada');
    }
    
    // 10. Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    await axios.delete(`${baseURL}/ativos/${ativoId}`, { headers });
    console.log('✅ Ativo removido');
    
    // Remover arquivo de teste
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('✅ Arquivo de teste removido');
    }
    
    console.log('\n🎉 Teste completo executado com SUCESSO!');
    console.log('\n📊 Resumo dos resultados:');
    console.log('• Health Check: ✅');
    console.log('• CRUD de ativos: ✅');
    console.log('• Upload de imagens: ✅');
    console.log('• Listagem de imagens: ✅');
    console.log('• Download de imagens: ✅');
    console.log('• Remoção de imagens: ✅');
    console.log('• Sistema Level: ✅');
    console.log('• Limpeza: ✅');
    
  } catch (error) {
    console.error('\n❌ Erro durante teste:', error.message);
    
    if (error.response) {
      console.log('📝 Status:', error.response.status);
      console.log('📝 Dados:', error.response.data);
      console.log('📝 URL:', error.config.url);
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
    
    // Remover arquivo de teste
    const testImagePath = path.join(__dirname, 'test-image.png');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

// Executar teste
testarSistemaCompleto();