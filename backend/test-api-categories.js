const axios = require('axios');

async function testCategoriesAPI() {
  try {
    console.log('🔍 Testando API de categorias...');
    
    // Testar endpoint público das categorias ativas
    try {
      const responseActive = await axios.get('http://localhost:3001/api/categories/active');
      console.log('✅ GET /api/categories/active funcionando');
      console.log('📋 Categorias ativas encontradas:', responseActive.data?.categorias?.length || 0);
    } catch (error) {
      console.log('❌ GET /api/categories/active falhou:', error.response?.status || error.message);
    }
    
    // Testar endpoint principal (requer autenticação)
    try {
      const responseAll = await axios.get('http://localhost:3001/api/categories');
      console.log('✅ GET /api/categories funcionando');
      console.log('📋 Resposta:', responseAll.data);
    } catch (error) {
      console.log('⚠️ GET /api/categories:', error.response?.status, error.response?.data?.message || error.message);
      if (error.response?.status === 401) {
        console.log('💡 Erro 401 é esperado - endpoint requer autenticação');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testCategoriesAPI();