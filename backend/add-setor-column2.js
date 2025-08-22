const { Sequelize } = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize('manutencao_db', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log
});

async function addSetorColumn() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna setor_id já existe
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'manutencao_db' 
      AND TABLE_NAME = 'solicitacoes' 
      AND COLUMN_NAME = 'setor_id'
    `);

    if (columns.length === 0) {
      await sequelize.query(`
        ALTER TABLE solicitacoes 
        ADD COLUMN setor_id INT NULL,
        ADD INDEX idx_solicitacoes_setor_id (setor_id)
      `);
      console.log('✅ Coluna setor_id adicionada');
    } else {
      console.log('ℹ️ Coluna setor_id já existe');
    }

    console.log('🎉 Migração de setor_id concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await sequelize.close();
  }
}

addSetorColumn();
