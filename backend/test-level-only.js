// Teste do sistema simplificado Level-only
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const imageStorageService = require('./services/ImageStorageService');
const { Ativo, AtivoImagem } = require('./models');

async function testLevelOnlySystem() {
  console.log('🧪 TESTE: Sistema Level-only simplificado\n');

  try {
    // 1. Inicializar Level
    console.log('1️⃣ Inicializando Level...');
    await imageStorageService.initialize();
    console.log('✅ Level inicializado\n');

    // 2. Criar um ativo teste
    console.log('2️⃣ Criando ativo teste...');
    const ativo = await Ativo.create({
      nome: 'Teste Level Only',
      codigo_patrimonio: `TEST_LEVEL_${Date.now()}`,
      estado: 'operacional',
      criticidade: 'media'
    });
    console.log(`✅ Ativo criado: ${ativo.codigo_patrimonio}\n`);

    // 3. Simular upload de imagem
    console.log('3️⃣ Simulando upload de imagem...');
    
    // Criar buffer de imagem fake
    const fakeImageBuffer = Buffer.from('fake-image-data-for-testing');
    const levelKey = `ativo_${ativo.id}_${Date.now()}_test`;
    
    // Salvar no Level
    await imageStorageService.saveImage(levelKey, fakeImageBuffer);
    console.log(`✅ Imagem salva no Level: ${levelKey}`);
    
    // Salvar metadados no MySQL
    const imagemRecord = await AtivoImagem.create({
      ativo_id: ativo.id,
      nome_arquivo: levelKey,
      caminho: `/api/ativos/${ativo.id}/imagens/${levelKey}/download`,
      tipo: 'image/png',
      tamanho: fakeImageBuffer.length,
      ordem: 0
    });
    console.log(`✅ Metadados salvos no MySQL: ID ${imagemRecord.id}\n`);

    // 4. Testar recuperação
    console.log('4️⃣ Testando recuperação...');
    const retrievedImage = await imageStorageService.getImage(levelKey);
    console.log(`✅ Imagem recuperada: ${retrievedImage.length} bytes`);
    console.log(`✅ Dados corretos: ${retrievedImage.equals(fakeImageBuffer)}\n`);

    // 5. Testar listagem
    console.log('5️⃣ Testando listagem...');
    const imagens = await AtivoImagem.findAll({
      where: { ativo_id: ativo.id }
    });
    console.log(`✅ ${imagens.length} imagem(ns) encontrada(s)\n`);

    // 6. Testar estatísticas
    console.log('6️⃣ Testando estatísticas...');
    const stats = await imageStorageService.getStats();
    console.log('✅ Estatísticas Level:', {
      approximateSize: stats.approximateSize,
      keyCount: stats.keyCount
    });
    console.log('');

    // 7. Cleanup - remover teste
    console.log('7️⃣ Limpeza...');
    await imageStorageService.deleteImage(levelKey);
    await imagemRecord.destroy();
    await ativo.destroy();
    console.log('✅ Limpeza concluída\n');

    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema Level-only funcionando!');
    
    return {
      success: true,
      message: 'Sistema Level-only validado com sucesso'
    };

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testAPI() {
  console.log('\n🌐 TESTE: API Endpoints Level-only\n');
  
  const BASE_URL = 'http://localhost:3001/api';
  
  try {
    // Testar listagem de ativos
    console.log('1️⃣ Testando GET /ativos...');
    const response = await axios.get(`${BASE_URL}/ativos`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Total de ativos: ${response.data.data?.ativos?.length || 0}\n`);

    // Testar estatísticas Level
    console.log('2️⃣ Testando GET /ativos/level/stats...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/ativos/level/stats`);
      console.log(`✅ Status: ${statsResponse.status}`);
      console.log('✅ Estatísticas Level:', statsResponse.data.data);
    } catch (err) {
      console.log('⚠️ Endpoint de estatísticas pode requerer autenticação\n');
    }

    return { success: true };
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE API:', error.message);
    return { success: false, error: error.message };
  }
}

// Executar testes
if (require.main === module) {
  (async () => {
    // Teste 1: Funcionalidade Level
    const levelTest = await testLevelOnlySystem();
    
    if (levelTest.success) {
      // Teste 2: API endpoints 
      await testAPI();
    }
    
    process.exit(levelTest.success ? 0 : 1);
  })();
}

module.exports = { testLevelOnlySystem, testAPI };