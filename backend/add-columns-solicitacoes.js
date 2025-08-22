const { Sequelize } = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize('manutencao_db', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log
});

async function addColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se as colunas já existem
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'manutencao_db' 
      AND TABLE_NAME = 'solicitacoes' 
      AND COLUMN_NAME IN ('ativo_id', 'category_id', 'subcategory_id')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('ativo_id')) {
      await sequelize.query(`
        ALTER TABLE solicitacoes 
        ADD COLUMN ativo_id INT NULL,
        ADD INDEX idx_solicitacoes_ativo_id (ativo_id)
      `);
      console.log('✅ Coluna ativo_id adicionada');
    } else {
      console.log('ℹ️ Coluna ativo_id já existe');
    }

    if (!existingColumns.includes('category_id')) {
      await sequelize.query(`
        ALTER TABLE solicitacoes 
        ADD COLUMN category_id INT NULL,
        ADD INDEX idx_solicitacoes_category_id (category_id)
      `);
      console.log('✅ Coluna category_id adicionada');
    } else {
      console.log('ℹ️ Coluna category_id já existe');
    }

    if (!existingColumns.includes('subcategory_id')) {
      await sequelize.query(`
        ALTER TABLE solicitacoes 
        ADD COLUMN subcategory_id INT NULL,
        ADD INDEX idx_solicitacoes_subcategory_id (subcategory_id)
      `);
      console.log('✅ Coluna subcategory_id adicionada');
    } else {
      console.log('ℹ️ Coluna subcategory_id já existe');
    }

    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await sequelize.close();
  }
}

addColumns();