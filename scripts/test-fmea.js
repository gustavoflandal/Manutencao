const axios = require('axios');
const chalk = require('chalk');

const API_URL = 'http://localhost:3001/api';
let authToken;
let testFmea;
let testAction;
let testOS;

async function runTests() {
  console.log(chalk.blue('🔍 Iniciando testes do módulo FMEA...'));

  try {
    // Login
    console.log(chalk.yellow('\n1. Autenticação'));
    const authResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@sistema.com',
      senha: 'admin123'
    });
    authToken = authResponse.data.token;
    console.log(chalk.green('✓ Login realizado com sucesso'));

    // Configurar axios com token
    const api = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // Criar FMEA
    console.log(chalk.yellow('\n2. Criar Análise FMEA'));
    const fmeaResponse = await api.post('/fmea', {
      equipment_id: 1, // Ajuste conforme seu banco de dados
      component: 'Motor Elétrico Principal',
      function: 'Converter energia elétrica em energia mecânica',
      failure_mode: 'Falha no rolamento',
      failure_effect: 'Parada total do equipamento',
      failure_cause: 'Falta de lubrificação',
      current_controls: 'Inspeção visual mensal',
      severity: 8,
      occurrence: 6,
      detection: 4,
      recommended_actions: 'Implementar plano de lubrificação',
      responsible: 1, // Ajuste conforme seu banco de dados
      target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    testFmea = fmeaResponse.data.data;
    console.log(chalk.green('✓ FMEA criado com sucesso'));
    console.log(chalk.gray(`  RPN calculado: ${testFmea.rpn}`));

    // Adicionar Ação
    console.log(chalk.yellow('\n3. Adicionar Ação ao FMEA'));
    const actionResponse = await api.post(`/fmea/${testFmea.id}/actions`, {
      action_taken: 'Implementado plano de lubrificação semanal',
      new_severity: 8,
      new_occurrence: 3,
      new_detection: 2,
      completed_date: new Date()
    });
    testAction = actionResponse.data.data;
    console.log(chalk.green('✓ Ação adicionada com sucesso'));
    console.log(chalk.gray(`  Novo RPN: ${testAction.new_rpn}`));

    // Criar OS
    console.log(chalk.yellow('\n4. Criar OS a partir do FMEA'));
    const osResponse = await api.post('/ordens-servico', {
      fmea_id: testFmea.id,
      ativo_id: 1, // Ajuste conforme seu banco de dados
      tipo: 'preventiva',
      descricao_servico: 'Implementar plano de lubrificação conforme FMEA',
      data_inicio_prevista: new Date(),
      data_fim_prevista: new Date(Date.now() + 24 * 60 * 60 * 1000),
      responsavel_id: 1 // Ajuste conforme seu banco de dados
    });
    testOS = osResponse.data.data;
    console.log(chalk.green('✓ OS criada com sucesso'));
    console.log(chalk.gray(`  Número OS: ${testOS.numero_os}`));

    // Consultar FMEA
    console.log(chalk.yellow('\n5. Consultar FMEA'));
    const fmeaDetailsResponse = await api.get(`/fmea/${testFmea.id}`);
    console.log(chalk.green('✓ FMEA consultado com sucesso'));
    console.log(chalk.gray('  Detalhes do FMEA:'));
    console.log(chalk.gray(`    - Componente: ${fmeaDetailsResponse.data.data.component}`));
    console.log(chalk.gray(`    - RPN: ${fmeaDetailsResponse.data.data.rpn}`));
    console.log(chalk.gray(`    - Status: ${fmeaDetailsResponse.data.data.status}`));

    // Consultar Estatísticas
    console.log(chalk.yellow('\n6. Consultar Estatísticas'));
    const statsResponse = await api.get('/fmea/reports/statistics');
    console.log(chalk.green('✓ Estatísticas consultadas com sucesso'));
    console.log(chalk.gray('  Resumo:'));
    console.log(chalk.gray(`    - Total de Análises: ${statsResponse.data.data.total_analyses}`));
    console.log(chalk.gray(`    - Análises Críticas: ${statsResponse.data.data.critical_analyses}`));
    console.log(chalk.gray(`    - RPN Médio: ${statsResponse.data.data.average_rpn}`));

    // Atualizar FMEA
    console.log(chalk.yellow('\n7. Atualizar FMEA'));
    const updateResponse = await api.put(`/fmea/${testFmea.id}`, {
      status: 'in_progress',
      current_controls: 'Inspeção visual semanal e medição de vibração'
    });
    console.log(chalk.green('✓ FMEA atualizado com sucesso'));
    console.log(chalk.gray(`  Novo status: ${updateResponse.data.data.status}`));

    console.log(chalk.blue('\n✨ Todos os testes concluídos com sucesso!'));

  } catch (error) {
    console.log(chalk.red('\n❌ Erro durante os testes:'));
    console.error(error.response?.data || error.message);
  }
}

runTests();
