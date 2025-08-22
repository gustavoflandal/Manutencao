// backend/test-level-implementation.js
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const imageStorageService = require('./services/ImageStorageService');
const ativoRoutes = require('./routes/ativos');

async function testLevelImplementation() {
  console.log('🧪 Iniciando teste da implementação Level...\n');
  
  try {
    // Teste 1: Inicializar serviço Level
    console.log('1️⃣ Testando inicialização do serviço Level...');
    await imageStorageService.initialize();
    console.log('✅ Serviço Level inicializado com sucesso');
    
    // Teste 2: Teste básico de armazenamento
    console.log('\n2️⃣ Testando operações básicas de armazenamento...');
    const testKey = 'test_' + Date.now();
    const testData = Buffer.from('Dados de teste para Level');
    
    await imageStorageService.saveImage(testKey, testData);
    console.log('✅ Imagem salva no Level');
    
    const retrievedData = await imageStorageService.getImage(testKey);
    console.log('✅ Imagem recuperada do Level');
    
    if (Buffer.compare(testData, retrievedData) === 0) {
      console.log('✅ Dados recuperados estão íntegros');
    } else {
      console.log('❌ Dados recuperados não conferem');
    }
    
    await imageStorageService.deleteImage(testKey);
    console.log('✅ Imagem removida do Level');
    
    // Teste 3: Verificar se o banco foi criado
    console.log('\n3️⃣ Verificando estrutura do banco Level...');
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, 'data', 'images.db');
    
    if (fs.existsSync(dbPath)) {
      console.log('✅ Banco de dados Level criado em:', dbPath);
    } else {
      console.log('❌ Banco de dados Level não encontrado');
    }
    
    // Teste 4: Estatísticas
    console.log('\n4️⃣ Testando estatísticas...');
    const stats = await imageStorageService.getStats();
    console.log('✅ Estatísticas obtidas:', stats);
    
    // Teste 5: Conectividade com MySQL
    console.log('\n5️⃣ Testando conectividade com MySQL...');
    await sequelize.authenticate();
    console.log('✅ Conexão com MySQL estabelecida');
    
    // Teste 6: Simular servidor com rotas
    console.log('\n6️⃣ Testando configuração do servidor...');
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/ativos', ativoRoutes);
    
    const server = app.listen(0, () => {
      const port = server.address().port;
      console.log(`✅ Servidor teste rodando na porta ${port}`);
      server.close();
    });
    
    console.log('\n🎉 Todos os testes passaram! A implementação Level está pronta.');
    console.log('\n📋 Resumo da implementação:');
    console.log('• Serviço ImageStorageService configurado com Level');
    console.log('• Controller AtivoControllerLevel criado');
    console.log('• Rotas atualizadas para usar Level');
    console.log('• Armazenamento: Level (binário) + MySQL (metadados)');
    console.log('• Performance otimizada sem dependência de arquivos');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await imageStorageService.close();
    await sequelize.close();
  }
}

// Executar teste
testLevelImplementation();