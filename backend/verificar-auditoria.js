const { sequelize } = require('./models');

async function verificarAuditoria() {
  try {
    console.log('🔍 Verificando estrutura da auditoria...\n');

    // 1. Verificar se a tabela existe
    console.log('1. Verificando se tabela logs_operacoes existe...');
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'logs_operacoes'");
    
    if (tables.length === 0) {
      console.log('❌ Tabela logs_operacoes NÃO existe');
      console.log('   💡 Executar: node criar-tabela-auditoria.js');
      return;
    }
    
    console.log('✅ Tabela logs_operacoes existe');

    // 2. Verificar estrutura da tabela
    console.log('\n2. Estrutura da tabela:');
    const [structure] = await sequelize.query("DESCRIBE logs_operacoes");
    structure.forEach(field => {
      console.log(`   ${field.Field} (${field.Type})`);
    });

    // 3. Verificar quantidade de registros
    console.log('\n3. Registros na tabela:');
    const [count] = await sequelize.query("SELECT COUNT(*) as total FROM logs_operacoes");
    console.log(`   📊 Total de logs: ${count[0].total}`);

    // 4. Verificar últimos registros
    if (count[0].total > 0) {
      console.log('\n4. Últimos 5 registros:');
      const [logs] = await sequelize.query(`
        SELECT operacao, modulo, descricao, usuario_id, data_operacao 
        FROM logs_operacoes 
        ORDER BY data_operacao DESC 
        LIMIT 5
      `);
      
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. [${log.data_operacao}] ${log.operacao} - ${log.modulo}: ${log.descricao}`);
      });
    }

    // 5. Verificar se o AuditoriaService está funcionando
    console.log('\n5. Testando AuditoriaService...');
    const AuditoriaService = require('./services/AuditoriaService');
    
    await AuditoriaService.registrarOperacao({
      operacao: 'TEST',
      modulo: 'SISTEMA',
      descricao: 'Teste de verificação do sistema de auditoria',
      usuario_id: 1,
      recurso_tipo: 'TEST',
      recurso_id: 1,
      sucesso: true,
      ip_address: '127.0.0.1',
      user_agent: 'Script de Teste'
    });
    
    console.log('✅ Teste de gravação realizado com sucesso');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

verificarAuditoria();