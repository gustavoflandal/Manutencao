const sequelize = require('./config/database');

async function addSetorColumn() {
  try {
    console.log('🔧 Verificando e adicionando coluna setor_id na tabela ativos...');
    
    // Verificar se a coluna já existe
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ativos' 
      AND COLUMN_NAME = 'setor_id'
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (results.length > 0) {
      console.log('✅ Coluna setor_id já existe na tabela ativos');
      return;
    }
    
    // Adicionar a coluna setor_id
    await sequelize.query(`
      ALTER TABLE ativos 
      ADD COLUMN setor_id INT,
      ADD FOREIGN KEY (setor_id) REFERENCES setores(id)
    `);
    
    console.log('✅ Coluna setor_id adicionada com sucesso na tabela ativos');
    
    // Verificar se a tabela ordens_servico precisa da coluna também
    const [osResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ordens_servico' 
      AND COLUMN_NAME = 'setor_id'
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (osResults.length === 0) {
      console.log('🔧 Adicionando coluna setor_id na tabela ordens_servico...');
      await sequelize.query(`
        ALTER TABLE ordens_servico 
        ADD COLUMN setor_id INT,
        ADD FOREIGN KEY (setor_id) REFERENCES setores(id)
      `);
      console.log('✅ Coluna setor_id adicionada na tabela ordens_servico');
    } else {
      console.log('✅ Coluna setor_id já existe na tabela ordens_servico');
    }
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna setor_id:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  addSetorColumn()
    .then(() => {
      console.log('🎉 Script concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

module.exports = addSetorColumn;