const { Ativo, AtivoImagem } = require('./models');
const imageStorageService = require('./services/ImageStorageService');
const logger = require('./config/logger');

async function testImageUpload() {
  try {
    console.log('🧪 Testando sistema de upload de imagens...');
    
    // Teste 1: Verificar se ImageStorageService está disponível
    console.log('\n1️⃣ Verificando ImageStorageService...');
    try {
      await imageStorageService.initialize();
      console.log('✅ ImageStorageService inicializado com sucesso');
    } catch (error) {
      console.log('❌ Erro ao inicializar ImageStorageService:', error.message);
      return;
    }
    
    // Teste 2: Verificar se há ativos na base
    console.log('\n2️⃣ Verificando ativos disponíveis...');
    const ativos = await Ativo.findAll({
      limit: 5,
      attributes: ['id', 'nome', 'codigo_patrimonio']
    });
    
    if (ativos.length === 0) {
      console.log('⚠️ Nenhum ativo encontrado - criando um para teste');
      const novoAtivo = await Ativo.create({
        codigo_patrimonio: 'TEST-001',
        nome: 'Ativo de Teste',
        fabricante: 'Teste',
        estado: 'operacional',
        criticidade: 'baixa'
      });
      console.log('✅ Ativo criado:', novoAtivo.id);
    } else {
      console.log(`✅ ${ativos.length} ativos encontrados`);
      ativos.forEach(ativo => {
        console.log(`   - ID: ${ativo.id}, Nome: ${ativo.nome}, Código: ${ativo.codigo_patrimonio}`);
      });
    }
    
    // Teste 3: Simular upload de imagem
    console.log('\n3️⃣ Simulando upload de imagem...');
    const ativoId = ativos[0]?.id || 1;
    
    // Criar buffer simulado de imagem
    const fakeImageBuffer = Buffer.from('fake-image-data-for-testing');
    const levelKey = `ativo_${ativoId}_${Date.now()}_test`;
    
    try {
      // Salvar no Level
      await imageStorageService.saveImage(levelKey, fakeImageBuffer);
      console.log('✅ Imagem salva no Level com chave:', levelKey);
      
      // Salvar metadados no MySQL
      const imagemRecord = await AtivoImagem.create({
        ativo_id: ativoId,
        nome_arquivo: levelKey,
        caminho: `/api/ativos/${ativoId}/imagens/${levelKey}/download`,
        tipo: 'image/jpeg',
        tamanho: fakeImageBuffer.length,
        ordem: 0
      });
      
      console.log('✅ Metadados salvos no MySQL, ID:', imagemRecord.id);
      
    } catch (saveError) {
      console.log('❌ Erro ao salvar imagem:', saveError.message);
    }
    
    // Teste 4: Verificar recuperação
    console.log('\n4️⃣ Testando recuperação de imagem...');
    try {
      const recuperada = await imageStorageService.getImage(levelKey);
      if (recuperada && recuperada.length === fakeImageBuffer.length) {
        console.log('✅ Imagem recuperada com sucesso do Level');
      } else {
        console.log('❌ Imagem recuperada não confere com original');
      }
    } catch (getError) {
      console.log('❌ Erro ao recuperar imagem:', getError.message);
    }
    
    console.log('\n🎉 Teste de upload concluído!');
    
  } catch (error) {
    console.error('💥 Erro geral no teste:', error);
  } finally {
    process.exit(0);
  }
}

testImageUpload();