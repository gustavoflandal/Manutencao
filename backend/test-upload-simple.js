const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Criar uma imagem de teste PNG simples (1x1 pixel vermelho)
const createTestImage = () => {
  // PNG 1x1 pixel vermelho em base64
  const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  return pngData;
};

// Função para criar boundary multipart
const createFormData = (files) => {
  const boundary = `----formdata-upload-${Date.now()}`;
  let body = '';
  
  files.forEach((file, index) => {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="imagens"; filename="${file.filename}"\r\n`;
    body += `Content-Type: ${file.contentType}\r\n\r\n`;
  });
  
  return { boundary, body };
};

async function testUploadSimple() {
  console.log('🧪 Teste de upload simplificado...');
  
  try {
    // Criar dados de teste
    const imageBuffer = createTestImage();
    console.log('📷 Imagem de teste criada:', imageBuffer.length, 'bytes');
    
    // Criar FormData manualmente
    const boundary = `----formdata-upload-${Date.now()}`;
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="imagens"; filename="test.png"\r\n`;
    body += `Content-Type: image/png\r\n\r\n`;
    
    const bodyBuffer = Buffer.concat([
      Buffer.from(body, 'utf8'),
      imageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
    ]);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ativos/5/imagens',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length
      }
    };
    
    console.log('📤 Enviando requisição...');
    console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('Content-Type:', options.headers['Content-Type']);
    console.log('Content-Length:', options.headers['Content-Length']);
    
    const req = http.request(options, (res) => {
      console.log('📥 Resposta recebida:', res.statusCode, res.statusMessage);
      console.log('Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📋 Dados da resposta:', data);
        
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.success) {
            console.log('✅ Upload realizado com sucesso!');
            console.log('📊 Resultado:', jsonData);
          } else {
            console.log('❌ Upload falhou:', jsonData.message);
          }
        } catch (parseError) {
          console.log('❌ Erro ao parsear resposta:', parseError.message);
          console.log('Raw response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message);
    });
    
    req.write(bodyBuffer);
    req.end();
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testUploadSimple();