const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false
});

async function addDeletedAtToAllTables() {
  try {
    console.log('🔧 Verificando e adicionando coluna deleted_at em todas as tabelas necessárias...');
    
    const tabelas = ['ativos', 'setores', 'fmea_analysis', 'users', 'solicitacoes'];
    
    for (const tabela of tabelas) {
      try {
        console.log(`\n📋 Verificando tabela ${tabela}...`);
        
        // Verificar se a tabela existe
        const [results] = await sequelize.query(`DESCRIBE ${tabela}`);
        
        const temDeletedAt = results.find(col => col.Field === 'deleted_at');
        
        if (temDeletedAt) {
          console.log(`✅ ${tabela} já tem deleted_at`);
        } else {
          console.log(`➕ Adicionando deleted_at em ${tabela}...`);
          await sequelize.query(`
            ALTER TABLE ${tabela} 
            ADD COLUMN deleted_at DATETIME NULL
          `);
          console.log(`✅ Coluna deleted_at adicionada em ${tabela}`);
        }
      } catch (error) {
        console.log(`⚠️  Tabela ${tabela} não existe ou erro: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await sequelize.close();
  }
}

addDeletedAtToAllTables();