const { sequelize } = require('../models');
const logger = require('../config/logger');

async function fixDatabaseIssues() {
  try {
    console.log('🔧 Iniciando correções do banco de dados...');

    // 1. Verificar se a tabela solicitacoes existe e tem as colunas corretas
    const [solicitacoesColumns] = await sequelize.query(`
      SHOW COLUMNS FROM solicitacoes;
    `);

    const columnNames = solicitacoesColumns.map(col => col.Field);
    console.log('Colunas existentes na tabela solicitacoes:', columnNames);

    // 2. Verificar se falta alguma coluna importante
    const requiredColumns = [
      'id', 'numero', 'titulo', 'descricao', 'categoria', 'subcategoria',
      'category_id', 'subcategory_id', 'prioridade', 'status', 'localizacao',
      'observacoes', 'data_prevista', 'data_fechamento', 'solicitante_id',
      'responsavel_id', 'department_id', 'created_at', 'updated_at'
    ];

    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Colunas faltantes na tabela solicitacoes:', missingColumns);
      
      // Adicionar colunas faltantes (exemplo)
      for (const column of missingColumns) {
        try {
          switch (column) {
            case 'numero':
              await sequelize.query(`
                ALTER TABLE solicitacoes 
                ADD COLUMN numero VARCHAR(20) UNIQUE DEFAULT NULL;
              `);
              break;
            case 'category_id':
              await sequelize.query(`
                ALTER TABLE solicitacoes 
                ADD COLUMN category_id INT NULL,
                ADD FOREIGN KEY (category_id) REFERENCES categories(id);
              `);
              break;
            case 'subcategory_id':
              await sequelize.query(`
                ALTER TABLE solicitacoes 
                ADD COLUMN subcategory_id INT NULL,
                ADD FOREIGN KEY (subcategory_id) REFERENCES subcategories(id);
              `);
              break;
            // Adicionar outros casos conforme necessário
          }
          console.log(`✅ Coluna ${column} adicionada com sucesso`);
        } catch (error) {
          console.log(`⚠️ Erro ao adicionar coluna ${column}:`, error.message);
        }
      }
    } else {
      console.log('✅ Todas as colunas necessárias estão presentes');
    }

    // 3. Verificar se existe algum campo ativo_id indevido
    if (columnNames.includes('ativo_id')) {
      console.log('❌ Campo ativo_id encontrado na tabela solicitacoes - removendo...');
      try {
        await sequelize.query(`
          ALTER TABLE solicitacoes DROP COLUMN ativo_id;
        `);
        console.log('✅ Campo ativo_id removido com sucesso');
      } catch (error) {
        console.log('⚠️ Erro ao remover campo ativo_id:', error.message);
      }
    }

    // 4. Atualizar solicitações sem número
    const [solicitacoesSemNumero] = await sequelize.query(`
      SELECT id FROM solicitacoes WHERE numero IS NULL OR numero = '';
    `);

    if (solicitacoesSemNumero.length > 0) {
      console.log(`🔢 Encontradas ${solicitacoesSemNumero.length} solicitações sem número. Gerando números...`);
      
      for (let i = 0; i < solicitacoesSemNumero.length; i++) {
        const solicitacao = solicitacoesSemNumero[i];
        const numero = `SOL${String(solicitacao.id).padStart(6, '0')}`;
        
        try {
          await sequelize.query(`
            UPDATE solicitacoes 
            SET numero = :numero 
            WHERE id = :id;
          `, {
            replacements: { numero, id: solicitacao.id }
          });
        } catch (error) {
          console.log(`⚠️ Erro ao atualizar número da solicitação ${solicitacao.id}:`, error.message);
        }
      }
      console.log('✅ Números de solicitações atualizados');
    }

    // 5. Verificar integridade das tabelas
    console.log('🔍 Verificando integridade das tabelas...');
    
    const tables = ['users', 'departments', 'categories', 'subcategories', 'solicitacoes', 'ativos'];
    
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table};`);
        console.log(`📊 Tabela ${table}: ${result[0].count} registros`);
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela ${table}:`, error.message);
      }
    }

    console.log('✅ Correções do banco de dados concluídas!');
    
  } catch (error) {
    logger.error('Erro durante correções do banco:', error);
    console.error('❌ Erro durante correções:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixDatabaseIssues()
    .then(() => {
      console.log('Script de correção finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseIssues };