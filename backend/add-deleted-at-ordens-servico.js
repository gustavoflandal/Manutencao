const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false
});

async function addDeletedAtColumn() {
  try {
    console.log('🔧 Adicionando coluna deleted_at à tabela ordens_servico...');
    
    // Verificar se a coluna já existe
    const [results] = await sequelize.query(`
      DESCRIBE ordens_servico
    `);
    
    const temDeletedAt = results.find(col => col.Field === 'deleted_at');
    
    if (temDeletedAt) {
      console.log('✅ Coluna deleted_at já existe!');
    } else {
      console.log('➕ Adicionando coluna deleted_at...');
      await sequelize.query(`
        ALTER TABLE ordens_servico 
        ADD COLUMN deleted_at DATETIME NULL
      `);
      console.log('✅ Coluna deleted_at adicionada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
  } finally {
    await sequelize.close();
  }
}

addDeletedAtColumn();