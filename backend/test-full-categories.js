const axios = require('axios');

async function testFullCategoriesFlow() {
  try {
    console.log('🔍 Testando fluxo completo de categorias...');
    
    // 1. Fazer login primeiro
    console.log('👤 Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@sistema.com',
      senha: '123456'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login falhou:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', loginResponse.data.data.user.nome);
    console.log('🔑 Token recebido');
    
    // 2. Testar endpoint de categorias com autenticação
    console.log('\n📂 Testando GET /api/categories...');
    const categoriesResponse = await axios.get('http://localhost:3001/api/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GET /api/categories funcionando');
    console.log('📋 Estrutura da resposta:', {
      success: categoriesResponse.data.success,
      hasData: !!categoriesResponse.data.data,
      hasCategories: !!categoriesResponse.data.data?.categorias,
      totalCategories: categoriesResponse.data.data?.categorias?.length || 0,
      hasPagination: !!categoriesResponse.data.data?.pagination
    });
    
    if (categoriesResponse.data.data?.categorias?.length > 0) {
      console.log('📋 Primeiras categorias:');
      categoriesResponse.data.data.categorias.slice(0, 3).forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.nome} (ID: ${cat.id}, Ativo: ${cat.ativo})`);
      });
    }
    
    // 3. Testar criação de categoria
    console.log('\n➕ Testando POST /api/categories...');
    try {
      const newCategoryResponse = await axios.post('http://localhost:3001/api/categories', {
        nome: 'Categoria Teste',
        descricao: 'Categoria criada para teste',
        cor: '#FF5733',
        icone: 'fas fa-test',
        ativo: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ POST /api/categories funcionando');
      console.log('📋 Categoria criada:', newCategoryResponse.data.data?.categoria?.nome);
      
      // Limpar - deletar a categoria teste
      const categoryId = newCategoryResponse.data.data?.categoria?.id;
      if (categoryId) {
        await axios.delete(`http://localhost:3001/api/categories/${categoryId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('🧹 Categoria teste removida');
      }
      
    } catch (createError) {
      console.log('❌ POST /api/categories falhou:', createError.response?.data?.message || createError.message);
    }
    
    console.log('\n✅ Teste completo finalizado!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testFullCategoriesFlow();