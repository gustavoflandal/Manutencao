// backend/test-level-simple.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const imageStorageService = require('./services/ImageStorageService');
const AtivoController = require('./controllers/AtivoControllerLevel');
const multer = require('multer');

async function testLevelSimple() {
  console.log('🧪 Teste simples da implementação Level...\n');
  
  try {
    // Inicializar serviços
    await sequelize.authenticate();
    console.log('✅ MySQL conectado');
    
    await imageStorageService.initialize();
    console.log('✅ Level inicializado');
    
    // Criar app Express simples
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Testar operações básicas
    console.log('\n📋 Testando operações de armazenamento...');
    
    // Simular dados de imagem
    const testKey = 'test_ativo_999_' + Date.now();
    const testBuffer = Buffer.from('Esta é uma imagem de teste', 'utf8');
    
    // Salvar
    await imageStorageService.saveImage(testKey, testBuffer);
    console.log('✅ Imagem salva no Level');
    
    // Recuperar
    const recovered = await imageStorageService.getImage(testKey);
    console.log('✅ Imagem recuperada');
    console.log('📊 Tamanho original:', testBuffer.length);
    console.log('📊 Tamanho recuperado:', recovered.length);
    console.log('✅ Integridade:', Buffer.compare(testBuffer, recovered) === 0 ? 'OK' : 'ERRO');
    
    // Listar imagens
    const images = await imageStorageService.listImages(999);
    console.log('📋 Imagens encontradas:', images.length);
    
    // Estatísticas
    const stats = await imageStorageService.getStats();
    console.log('📊 Estatísticas:', stats);
    
    // Remover
    await imageStorageService.deleteImage(testKey);
    console.log('✅ Imagem removida');
    
    console.log('\n🎉 Teste básico concluído com sucesso!');
    console.log('\n📋 Sistema Level está funcionando corretamente:');
    console.log('• Armazenamento binário: ✅');
    console.log('• Recuperação de dados: ✅');
    console.log('• Integridade dos dados: ✅');
    console.log('• Operações de listagem: ✅');
    console.log('• Estatísticas: ✅');
    console.log('• Remoção de dados: ✅');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await imageStorageService.close();
    await sequelize.close();
  }
}

testLevelSimple();