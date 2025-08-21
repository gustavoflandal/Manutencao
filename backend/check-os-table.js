const { sequelize } = require('./models');

async function checkTable() {
  try {
    const [results] = await sequelize.query("DESCRIBE ordens_servico");
    console.log('📋 Campos da tabela ordens_servico:');
    results.forEach(field => {
      console.log(`   ${field.Field} (${field.Type})`);
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTable();