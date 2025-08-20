const { sequelize } = require('./models');

async function addColumns() {
  try {
    console.log('Iniciando adição de colunas...');
    
    // Verificar e adicionar colunas uma por uma
    const columns = [
      'ativo_id INT NULL',
      'solicitacao_id INT NULL', 
      'solicitante_id INT NULL',
      'responsavel_id INT NULL',
      'materiais_utilizados JSON NULL',
      'fotos_antes JSON NULL',
      'fotos_depois JSON NULL',
      'checklist JSON NULL'
    ];
    
    for (const column of columns) {
      try {
        await sequelize.query(`ALTER TABLE ordens_servico ADD COLUMN ${column}`);
        console.log(`✅ Adicionada coluna: ${column}`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`ℹ️  Coluna já existe: ${column.split(' ')[0]}`);
        } else {
          console.error(`❌ Erro ao adicionar ${column}:`, error.message);
        }
      }
    }
    
    console.log('✅ Processo concluído');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

addColumns();