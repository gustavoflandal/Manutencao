const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('🧪 Testando upload de imagem via API...');
    
    // Criar uma imagem de teste
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    const testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, testImageData);
    
    console.log('📁 Imagem de teste criada:', testImagePath);
    
    // Criar FormData
    const form = new FormData();
    form.append('imagens', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    // Fazer upload para o ativo ID 5
    console.log('📤 Enviando upload para /api/ativos/5/imagens...');
    
    const response = await axios.post('http://localhost:3000/api/ativos/5/imagens', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer test-token' // Se necessário
      },
      timeout: 10000
    });
    
    console.log('✅ Resposta da API:', response.status, response.statusText);
    console.log('📋 Dados retornados:', JSON.stringify(response.data, null, 2));
    
    // Limpar arquivo de teste
    fs.unlinkSync(testImagePath);
    console.log('🗑️ Arquivo de teste removido');
    
    console.log('🎉 Teste de upload concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste de upload:');
    console.error('Status:', error.response?.status);
    console.error('Dados:', error.response?.data);
    console.error('Erro:', error.message);
    
    // Limpar arquivo de teste em caso de erro
    const testImagePath = path.join(__dirname, 'test-image.png');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🗑️ Arquivo de teste removido após erro');
    }
  }
}

testUpload();