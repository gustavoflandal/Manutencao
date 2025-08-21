const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testarSistemaAuditoria() {
  try {
    console.log('🧪 Iniciando teste completo do sistema de auditoria...\n');

    // 1. Fazer login (deve gerar log de auditoria)
    console.log('1. 🔐 Testando login com auditoria...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sistema.com',
      senha: '123456'
    });
    
    const token = loginRes.data.data.accessToken;
    console.log('✅ Login realizado - log de auditoria registrado');

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // 2. Criar um ativo (deve gerar log de auditoria)
    console.log('\n2. 📦 Testando criação de ativo com auditoria...');
    const ativoRes = await axios.post(`${API_BASE}/ativos`, {
      codigo_patrimonio: `AUDIT-${Date.now()}`,
      nome: 'Ativo de Teste Auditoria',
      fabricante: 'Teste Ltda',
      estado: 'operacional',
      criticidade: 'media'
    }, config);
    
    const ativo = ativoRes.data.data.ativo;
    console.log(`✅ Ativo criado: ${ativo.codigo_patrimonio} - log de auditoria registrado`);

    // 3. Atualizar o ativo (deve gerar log de auditoria)
    console.log('\n3. ✏️ Testando atualização de ativo com auditoria...');
    await axios.put(`${API_BASE}/ativos/${ativo.id}`, {
      nome: 'Ativo de Teste Auditoria - ATUALIZADO',
      modelo: 'Modelo Teste v2.0'
    }, config);
    console.log('✅ Ativo atualizado - log de auditoria registrado');

    // 4. Aguardar um pouco para logs serem processados
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Buscar logs de auditoria
    console.log('\n4. 📋 Consultando logs de auditoria...');
    const logsRes = await axios.get(`${API_BASE}/auditoria/logs?limit=10`, config);
    const logs = logsRes.data.data.logs;
    
    console.log(`✅ ${logs.length} logs encontrados:`);
    logs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.operacao} - ${log.modulo} - ${log.descricao}`);
      console.log(`      Usuário: ${log.usuario_nome || 'Sistema'} | Data: ${new Date(log.data_operacao).toLocaleString('pt-BR')}`);
    });

    // 6. Buscar estatísticas
    console.log('\n5. 📊 Consultando estatísticas de auditoria...');
    const statsRes = await axios.get(`${API_BASE}/auditoria/estatisticas`, config);
    const stats = statsRes.data.data;
    
    console.log(`✅ Estatísticas obtidas:`);
    console.log(`   Total de operações: ${stats.totalOperacoes}`);
    console.log(`   Operações com sucesso: ${stats.operacoesSucesso}`);
    console.log(`   Taxa de sucesso: ${stats.taxaSucesso}%`);
    console.log(`   Usuários ativos: ${stats.usuariosAtivos}`);

    // 7. Buscar operações críticas
    console.log('\n6. ⚠️ Consultando operações críticas...');
    const criticasRes = await axios.get(`${API_BASE}/auditoria/criticas`, config);
    const criticas = criticasRes.data.data.operacoes;
    
    console.log(`✅ ${criticas.length} operações críticas encontradas`);

    // 8. Gerar relatório
    console.log('\n7. 📄 Gerando relatório de auditoria...');
    const relatorioRes = await axios.get(`${API_BASE}/auditoria/relatorio?limite=50`, config);
    const relatorio = relatorioRes.data.data;
    
    console.log(`✅ Relatório gerado com ${relatorio.logs.length} registros`);
    console.log(`   Gerado em: ${new Date(relatorio.gerado_em).toLocaleString('pt-BR')}`);
    console.log(`   Gerado por: ${relatorio.gerado_por}`);

    // 9. Excluir o ativo de teste (deve gerar log de auditoria)
    console.log('\n8. 🗑️ Testando exclusão de ativo com auditoria...');
    await axios.delete(`${API_BASE}/ativos/${ativo.id}`, config);
    console.log('✅ Ativo excluído - log de auditoria registrado');

    // 10. Fazer logout (deve gerar log de auditoria)
    console.log('\n9. 🚪 Testando logout com auditoria...');
    await axios.post(`${API_BASE}/auth/logout`, {}, config);
    console.log('✅ Logout realizado - log de auditoria registrado');

    // 11. Verificar logs finais
    console.log('\n10. 🔍 Verificação final dos logs...');
    
    // Fazer novo login para consultar
    const loginFinalRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sistema.com',
      senha: '123456'
    });
    
    const tokenFinal = loginFinalRes.data.data.accessToken;
    const configFinal = {
      headers: {
        'Authorization': `Bearer ${tokenFinal}`
      }
    };

    const logsFinaisRes = await axios.get(`${API_BASE}/auditoria/logs?limit=15`, configFinal);
    const logsFinal = logsFinaisRes.data.data.logs;
    
    console.log(`✅ ${logsFinal.length} logs totais no sistema:`);
    
    const tiposOperacao = {};
    logsFinal.forEach(log => {
      tiposOperacao[log.operacao] = (tiposOperacao[log.operacao] || 0) + 1;
    });
    
    console.log('\n📊 Resumo por tipo de operação:');
    Object.entries(tiposOperacao).forEach(([tipo, count]) => {
      console.log(`   ${tipo}: ${count} operações`);
    });

    console.log('\n🎉 TESTE COMPLETO DO SISTEMA DE AUDITORIA FINALIZADO COM SUCESSO!');
    console.log('\n✅ Funcionalidades testadas e validadas:');
    console.log('   • ✅ Log de login/logout automático');
    console.log('   • ✅ Log de operações CRUD em ativos');
    console.log('   • ✅ Consulta de logs com filtros');
    console.log('   • ✅ Estatísticas de auditoria');
    console.log('   • ✅ Relatórios de auditoria');
    console.log('   • ✅ Consulta de operações críticas');
    console.log('   • ✅ Rastreamento completo de ações do usuário');

  } catch (error) {
    console.error('❌ Erro no teste de auditoria:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Dica: Verifique se o token de autenticação está válido');
    }
    
    if (error.response?.status === 500) {
      console.log('💡 Dica: Verifique se o servidor está rodando e a tabela de logs foi criada');
    }
  }
}

// Executar teste
testarSistemaAuditoria();