const { Sequelize } = require('sequelize');

// Criar conexão direta
const sequelize = new Sequelize('sistema_manutencao', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

async function checkTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela ordens_servico...');
    
    // Verifica se a tabela existe
    const [results] = await sequelize.query(`
      DESCRIBE ordens_servico
    `);
    
    console.log('\n📋 Colunas encontradas na tabela ordens_servico:');
    results.forEach(column => {
      console.log(`- ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `KEY: ${column.Key}` : ''}`);
    });
    
    // Verifica se existe setor_id
    const temSetorId = results.find(col => col.Field === 'setor_id');
    console.log(`\n❓ Campo setor_id existe: ${temSetorId ? 'SIM' : 'NÃO'}`);
    
    if (temSetorId) {
      console.log('⚠️  PROBLEMA: A tabela tem o campo setor_id mas o modelo não!');
    } else {
      console.log('✅ OK: A tabela não tem o campo setor_id, como esperado pelo modelo');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTable();