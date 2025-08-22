// Teste específico dos logs Level
const imageStorageService = require('./services/ImageStorageService');
const { Ativo, AtivoImagem } = require('./models');

async function testLevelLogs() {
  console.log('🧪 TESTE: Sistema de Logs Level\n');

  try {
    // 1. Inicializar Level (com logs)
    console.log('1️⃣ Testando logs de inicialização...');
    await imageStorageService.initialize();

    // 2. Criar ativo teste
    const ativo = await Ativo.create({
      nome: 'Teste Logs Level',
      codigo_patrimonio: `LOG_TEST_${Date.now()}`,
      estado: 'operacional',
      criticidade: 'media'
    });

    // 3. Testar logs de save
    console.log('2️⃣ Testando logs de salvamento...');
    const fakeImageBuffer = Buffer.from('fake-image-data-for-logging-test');
    const levelKey = `ativo_${ativo.id}_${Date.now()}_logtest`;
    
    await imageStorageService.saveImage(levelKey, fakeImageBuffer);

    // Salvar metadados
    const imagemRecord = await AtivoImagem.create({
      ativo_id: ativo.id,
      nome_arquivo: levelKey,
      caminho: `/api/ativos/${ativo.id}/imagens/${levelKey}/download`,
      tipo: 'image/png',
      tamanho: fakeImageBuffer.length,
      ordem: 0
    });

    // 4. Testar logs de get
    console.log('3️⃣ Testando logs de recuperação...');
    await imageStorageService.getImage(levelKey);

    // 5. Testar logs de listagem
    console.log('4️⃣ Testando logs de listagem...');
    await imageStorageService.listImages(ativo.id);

    // 6. Testar logs de estatísticas
    console.log('5️⃣ Testando logs de estatísticas...');
    await imageStorageService.getStats();

    // 7. Testar logs de delete
    console.log('6️⃣ Testando logs de remoção...');
    await imageStorageService.deleteImage(levelKey);

    // 8. Cleanup
    await imagemRecord.destroy();
    await ativo.destroy();

    console.log('\n🎉 TESTE DE LOGS CONCLUÍDO!');
    console.log('✅ Verifique os logs do sistema para ver os detalhes Level');
    console.log('📊 Logs incluem: operação, duração, tamanhos, chaves, usuários');
    
    return { success: true };

  } catch (error) {
    console.error('❌ ERRO NO TESTE DE LOGS:', error);
    return { success: false, error: error.message };
  }
}

// Executar teste
if (require.main === module) {
  testLevelLogs().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { testLevelLogs };