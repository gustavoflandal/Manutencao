const { sequelize } = require('./models');
const AuditoriaService = require('./services/AuditoriaService');

async function configurarAuditoria() {
  try {
    console.log('🔧 Configurando sistema de auditoria...\n');

    // Sincronizar banco de dados
    console.log('📊 Sincronizando banco de dados...');
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Banco sincronizado\n');

    // Testar criação de log
    console.log('🧪 Testando sistema de auditoria...');
    
    const logTeste = await AuditoriaService.registrarOperacao({
      operacao: AuditoriaService.operacoes.CREATE,
      modulo: AuditoriaService.modulos.SISTEMA,
      descricao: 'Teste de configuração do sistema de auditoria',
      usuario: { id: 1, nome: 'Sistema', email: 'sistema@manutencao.com' },
      req: null,
      nivelRisco: AuditoriaService.nivelRisco.BAIXO,
      observacoes: 'Log de teste criado durante configuração inicial'
    });

    if (logTeste) {
      console.log('✅ Sistema de auditoria configurado com sucesso!');
      console.log(`   Log de teste criado com ID: ${logTeste.id}`);
    } else {
      console.log('⚠️  Sistema configurado, mas houve problema no teste');
    }

    // Mostrar estatísticas
    console.log('\n📊 Estatísticas atuais:');
    const stats = await AuditoriaService.obterEstatisticas();
    console.log(`   Total de operações: ${stats.totalOperacoes}`);
    console.log(`   Operações com sucesso: ${stats.operacoesSucesso}`);
    console.log(`   Operações críticas: ${stats.operacoesCriticas}`);
    console.log(`   Taxa de sucesso: ${stats.taxaSucesso}%`);

    console.log('\n🎉 Configuração completa!');
    console.log('\n📋 Funcionalidades disponíveis:');
    console.log('   • Auditoria automática de operações CRUD');
    console.log('   • Logs de login/logout');
    console.log('   • Rastreamento de operações críticas');
    console.log('   • Relatórios de auditoria');
    console.log('   • Estatísticas de uso');
    console.log('\n🌐 Endpoints disponíveis:');
    console.log('   GET /api/auditoria/logs - Listar logs');
    console.log('   GET /api/auditoria/estatisticas - Estatísticas');
    console.log('   GET /api/auditoria/relatorio - Relatório');
    console.log('   GET /api/auditoria/criticas - Operações críticas');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao configurar auditoria:', error);
    process.exit(1);
  }
}

configurarAuditoria();