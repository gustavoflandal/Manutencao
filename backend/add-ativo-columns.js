const { sequelize } = require('./models');

async function addAdvancedColumns() {
  try {
    console.log('Adicionando campos avançados de manutenção...');
    
    const columns = [
      'vida_util_anos INT NULL',
      'ultima_manutencao DATE NULL', 
      'proxima_manutencao DATE NULL',
      'intervalo_manutencao_dias INT NULL',
      'custo_manutencao_total DECIMAL(15,2) DEFAULT 0.00',
      'mtbf_horas DECIMAL(10,2) NULL',
      'mttr_horas DECIMAL(8,2) NULL',
      'historico_falhas JSON NULL',
      'parametros_operacao JSON NULL',
      'documentos_anexos JSON NULL'
    ];
    
    for (const column of columns) {
      try {
        await sequelize.query(`ALTER TABLE ativos ADD COLUMN ${column}`);
        console.log(`✅ Adicionada coluna: ${column.split(' ')[0]}`);
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

addAdvancedColumns();