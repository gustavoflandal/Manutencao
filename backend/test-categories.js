const { Category } = require('./models');

async function testCategories() {
  try {
    console.log('🔍 Testando conexão e dados de categorias...');
    const count = await Category.count();
    console.log('📊 Total de categorias no banco:', count);
    
    if (count > 0) {
      const categorias = await Category.findAll({ limit: 5 });
      console.log('📋 Primeiras 5 categorias:');
      categorias.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.nome} (ID: ${cat.id}, Ativo: ${cat.ativo})`);
      });
    } else {
      console.log('❌ Nenhuma categoria encontrada!');
      console.log('💡 Execute a inicialização do banco: node initialize-database.js');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testCategories();