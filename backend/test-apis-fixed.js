const axios = require('axios');

async function testAPIs() {
  const baseURL = 'http://localhost:3000/api';
  
  console.log('🧪 Testando APIs corrigidas...\n');
  
  try {
    // Teste 1: Ordens de Serviço
    console.log('1️⃣ Testando /ordens-servico...');
    try {
      const response = await axios.get(`${baseURL}/ordens-servico?limit=1`, {
        headers: { Authorization: 'Bearer fake-token' }
      });
      console.log('❌ Deveria ter dado erro de autenticação');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ API respondendo (erro 401 esperado)');
      } else if (error.response?.status === 500) {
        console.log('❌ Erro 500 ainda presente:', error.response.data?.message);
      } else {
        console.log('❓ Erro inesperado:', error.response?.status, error.message);
      }
    }
    
    // Teste 2: Upload de imagens
    console.log('\n2️⃣ Testando /ativos/5/imagens...');
    try {
      const formData = new FormData();
      formData.append('imagens', Buffer.from('fake-image'), 'test.jpg');
      
      const response = await axios.post(`${baseURL}/ativos/5/imagens`, formData, {
        headers: { 
          Authorization: 'Bearer fake-token',
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('❌ Deveria ter dado erro de autenticação');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ API respondendo (erro 401 esperado)');
      } else if (error.response?.status === 500) {
        console.log('❌ Erro 500 ainda presente:', error.response.data?.message);
      } else {
        console.log('❓ Erro inesperado:', error.response?.status, error.message);
      }
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

testAPIs();