const axios = require('axios');
const colors = require('colors/safe');
const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const app = require('../app');
const http = require('http');

// Configuração
const PORT = 3001;
const API_URL = `http://localhost:${PORT}/api`;

// Usuários de teste
const TEST_USERS = {
  admin: {
    email: 'admin@sistema.com',
    senha: '123456',
    nome: 'Administrador Teste',
    perfil: 'administrador'
  },
  supervisor: {
    email: 'supervisor@sistema.com',
    senha: '123456',
    nome: 'Supervisor Teste',
    perfil: 'supervisor'
  },
  tecnico: {
    email: 'tecnico@sistema.com',
    senha: '123456',
    nome: 'Técnico Teste',
    perfil: 'tecnico'
  }
};

// Dados de teste
const TEST_DATA = {
  ativo: {
    nome: 'Equipamento Teste',
    codigo_patrimonio: 'EQ-TEST-001',
    modelo: 'Modelo Teste',
    fabricante: 'Fabricante Teste',
    numero_serie: 'SN-TEST-001',
    data_aquisicao: new Date(),
    estado: 'operacional',
    criticidade: 'alta',
    observacoes: 'Equipamento para testes',
    ultima_manutencao: new Date(),
    proxima_manutencao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
    intervalo_manutencao_dias: 30,
    vida_util_anos: 10,
    custo_manutencao_total: 0,
    mtbf_horas: 1000,
    mttr_horas: 4,
    ativo: true
  },
  setor: {
    nome: 'Setor Teste',
    codigo: 'SET-TEST-001',
    descricao: 'Setor para testes',
    responsavel_id: null // Será preenchido durante os testes
  },
  fmea: {
    equipment_id: null, // Será preenchido durante os testes
    component: 'Componente Teste',
    function: 'Função do componente teste',
    failure_mode: 'Modo de falha teste',
    failure_effect: 'Efeito da falha teste',
    failure_cause: 'Causa da falha teste',
    current_controls: 'Controles atuais teste',
    severity: 8,
    occurrence: 6,
    detection: 4,
    status: 'draft'
  },
  ordem_servico: {
    ativo_id: null, // Será preenchido durante os testes
    tipo: 'corretiva',
    descricao_servico: 'Manutenção corretiva teste - Substituição de componente com desgaste',
    prioridade: 'alta',
    data_inicio_prevista: new Date(),
    data_fim_prevista: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 dia
    horas_planejadas: 4,
    observacoes: 'Ordem de serviço para testes',
    fmea_id: null // Adicionado para permitir ordens de serviço sem FMEA
  }
};

// Rotas para testar
const TEST_ROUTES = {
  fmea: {
    list: { method: 'get', path: '/fmea', permission: 'view_fmea' },
    create: { method: 'post', path: '/fmea', permission: 'create_fmea', data: () => TEST_DATA.fmea },
    update: { method: 'put', path: '/fmea/1', permission: 'edit_fmea', data: () => ({ ...TEST_DATA.fmea, severity: 9 }) },
    delete: { method: 'delete', path: '/fmea/1', permission: 'delete_fmea' }
  },
  users: {
    list: { method: 'get', path: '/users', permission: 'view_users' },
    create: { method: 'post', path: '/users', permission: 'create_users' }
  },
  ordens: {
    list: { method: 'get', path: '/ordens-servico', permission: 'view_os' },
    create: { 
      method: 'post', 
      path: '/ordens-servico', 
      permission: 'create_os',
      data: () => ({
        ...TEST_DATA.ordem_servico,
        data_inicio_prevista: TEST_DATA.ordem_servico.data_inicio_prevista.toISOString(),
        data_fim_prevista: TEST_DATA.ordem_servico.data_fim_prevista.toISOString()
      })
    }
  }
};

// Cliente API com interceptors para logs
const api = axios.create({
  baseURL: API_URL,
  validateStatus: null
});

api.interceptors.request.use(request => {
  console.log(colors.gray(`\n→ ${request.method.toUpperCase()} ${request.url}`));
  return request;
});

api.interceptors.response.use(response => {
  const color = response.status < 400 ? colors.green : colors.red;
  console.log(color(`← ${response.status} ${response.statusText}`));
  return response;
});

// Funções auxiliares
const clearDatabase = async () => {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'workflow_acoes', 'workflow_instancias', 'workflows',
      'user_permissions', 'permissions', 'ordens_servico',
      'solicitacoes', 'ativos', 'setores', 'users'
    ];
    
    for (const table of tables) {
      try {
        await sequelize.query(`TRUNCATE TABLE ${table}`);
        console.log(colors.green(`✓ Tabela ${table} limpa com sucesso`));
      } catch (error) {
        console.log(colors.yellow(`⚠️ Tabela ${table} não encontrada ou não pode ser limpa`));
      }
    }
    
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(colors.green('\n✓ Banco de dados limpo com sucesso'));
  } catch (error) {
    console.log(colors.red(`\n✗ Erro ao limpar banco de dados: ${error.message}`));
    throw error;
  }
};

const createTestUser = async (userData) => {
  try {
    const [user] = await sequelize.query(
      `INSERT INTO users (nome, email, senha, perfil, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [
          userData.nome,
          userData.email,
          await bcrypt.hash(userData.senha, 10),
          userData.perfil
        ]
      }
    );
    console.log(colors.green(`✓ Usuário ${userData.perfil} criado: ${userData.email}`));
    return { id: user, ...userData };
  } catch (error) {
    console.log(colors.red(`✗ Erro ao criar usuário ${userData.perfil}: ${error.message}`));
    return null;
  }
};

const createTestPermission = async (name, module, action) => {
  try {
    const [permission] = await sequelize.query(
      `INSERT INTO permissions (name, module, action, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      {
        replacements: [name, module, action]
      }
    );
    console.log(colors.green(`✓ Permissão criada: ${name}`));
    return { id: permission, name, module, action };
  } catch (error) {
    console.log(colors.red(`✗ Erro ao criar permissão ${name}: ${error.message}`));
    return null;
  }
};

const assignPermission = async (user, permission) => {
  try {
    await sequelize.query(
      `INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW(), NOW())`,
      {
        replacements: [user.id, permission.id, user.id]
      }
    );
    console.log(colors.green(`✓ Permissão ${permission.name} atribuída a ${user.email}`));
  } catch (error) {
    console.log(colors.red(`✗ Erro ao atribuir permissão: ${error.message}`));
  }
};

const loginUser = async (email, senha) => {
  const response = await api.post('/auth/login', { email, senha });
  if (response.status === 200 && response.data.data && response.data.data.accessToken) {
    return response.data.data.accessToken;
  }
  return null;
};

const createTestData = async (users) => {
  try {
    // Criar setor
    const [setor] = await sequelize.query(
      `INSERT INTO setores (nome, codigo, descricao, responsavel_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [
          TEST_DATA.setor.nome,
          TEST_DATA.setor.codigo,
          TEST_DATA.setor.descricao,
          users.supervisor.id
        ]
      }
    );
    console.log(colors.green(`✓ Setor de teste criado: ${TEST_DATA.setor.nome}`));

    // Criar ativo
    const [ativo] = await sequelize.query(
      `INSERT INTO ativos (nome, codigo_patrimonio, modelo, fabricante, numero_serie,
        data_aquisicao, estado, criticidade, observacoes, setor_id,
        ultima_manutencao, proxima_manutencao, intervalo_manutencao_dias,
        vida_util_anos, custo_manutencao_total, mtbf_horas, mttr_horas,
        ativo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [
          TEST_DATA.ativo.nome,
          TEST_DATA.ativo.codigo_patrimonio,
          TEST_DATA.ativo.modelo,
          TEST_DATA.ativo.fabricante,
          TEST_DATA.ativo.numero_serie,
          TEST_DATA.ativo.data_aquisicao,
          TEST_DATA.ativo.estado,
          TEST_DATA.ativo.criticidade,
          TEST_DATA.ativo.observacoes,
          setor,
          TEST_DATA.ativo.ultima_manutencao,
          TEST_DATA.ativo.proxima_manutencao,
          TEST_DATA.ativo.intervalo_manutencao_dias,
          TEST_DATA.ativo.vida_util_anos,
          TEST_DATA.ativo.custo_manutencao_total,
          TEST_DATA.ativo.mtbf_horas,
          TEST_DATA.ativo.mttr_horas,
          TEST_DATA.ativo.ativo
        ]
      }
    );
    console.log(colors.green(`✓ Ativo de teste criado: ${TEST_DATA.ativo.nome}`));

    // Atualizar dados de teste com IDs
    TEST_DATA.setor.id = setor;
    TEST_DATA.ativo.id = ativo;
    TEST_DATA.fmea.equipment_id = ativo;
    TEST_DATA.ordem_servico.ativo_id = ativo;

    return { setor, ativo };
  } catch (error) {
    console.log(colors.red(`✗ Erro ao criar dados de teste: ${error.message}`));
    throw error;
  }
};

const testRouteAccess = async (userType, route, token, expectedStatus) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  try {
    const response = await api({
      method: route.method,
      url: route.path,
      data: route.data ? route.data() : undefined
    });

    const success = response.status === expectedStatus;
    const color = success ? colors.green : colors.red;
    const symbol = success ? '✓' : '✗';
    
    console.log(color(`${symbol} ${userType} -> ${route.method.toUpperCase()} ${route.path}: ${response.status}`));
    
    return success;
  } catch (error) {
    console.log(colors.red(`✗ Erro ao testar rota: ${error.message}`));
    return false;
  }
};

// Função para esperar o servidor estar pronto
const waitForServer = (timeoutMs = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const tryConnect = () => {
      axios.get(`http://localhost:${PORT}/api/health`)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error('Timeout esperando servidor iniciar'));
          } else {
            setTimeout(tryConnect, 100);
          }
        });
    };
    tryConnect();
  });
};

// Testes
async function runTests() {
  let server;

  try {
    console.log(colors.yellow('\n🚀 Iniciando testes de permissões e níveis de acesso...\n'));

    // 0. Iniciar o servidor
    console.log(colors.cyan('0. Iniciando servidor de teste...'));
    server = http.createServer(app);
    server.listen(PORT);
    await waitForServer();
    console.log(colors.green('✓ Servidor iniciado na porta', PORT));

    // 1. Limpar ambiente de teste
    console.log(colors.cyan('\n1. Limpando ambiente de teste...'));
    await clearDatabase();

    // 2. Criar usuários de teste
    console.log(colors.cyan('\n2. Criando usuários de teste...'));
    const users = {};
    for (const [role, userData] of Object.entries(TEST_USERS)) {
      users[role] = await createTestUser(userData);
    }

    // 3. Criar permissões de teste
    console.log(colors.cyan('\n3. Criando permissões de teste...'));
    const permissions = {};
    for (const moduleRoutes of Object.values(TEST_ROUTES)) {
      for (const route of Object.values(moduleRoutes)) {
        if (!permissions[route.permission]) {
          permissions[route.permission] = await createTestPermission(
            route.permission,
            route.permission.split('_')[1],
            route.permission.split('_')[0]
          );
        }
      }
    }

    // 4. Atribuir permissões
    console.log(colors.cyan('\n4. Atribuindo permissões...'));
    
    // Admin tem todas as permissões
    for (const permission of Object.values(permissions)) {
      await assignPermission(users.admin, permission);
    }
    
    // Supervisor tem permissões de visualização e criação
    await assignPermission(users.supervisor, permissions.view_fmea);
    await assignPermission(users.supervisor, permissions.create_fmea);
    await assignPermission(users.supervisor, permissions.view_os);
    await assignPermission(users.supervisor, permissions.create_os);
    
    // Técnico tem apenas permissões de visualização
    await assignPermission(users.tecnico, permissions.view_fmea);
    await assignPermission(users.tecnico, permissions.view_os);

    // 5. Criar dados de teste
    console.log(colors.cyan('\n5. Criando dados de teste...'));
    const testData = await createTestData(users);

    // 6. Testar acessos
    console.log(colors.cyan('\n6. Testando acessos às rotas...'));

    // Login dos usuários
    const tokens = {
      admin: await loginUser(TEST_USERS.admin.email, TEST_USERS.admin.senha),
      supervisor: await loginUser(TEST_USERS.supervisor.email, TEST_USERS.supervisor.senha),
      tecnico: await loginUser(TEST_USERS.tecnico.email, TEST_USERS.tecnico.senha)
    };

    // 6.1 Testar rotas FMEA
    console.log(colors.cyan('\n6.1. Testando rotas FMEA'));
    
    // Admin deve ter acesso total
    await testRouteAccess('Admin', TEST_ROUTES.fmea.list, tokens.admin, 200);
    await testRouteAccess('Admin', TEST_ROUTES.fmea.create, tokens.admin, 201);
    await testRouteAccess('Admin', TEST_ROUTES.fmea.update, tokens.admin, 200);
    await testRouteAccess('Admin', TEST_ROUTES.fmea.delete, tokens.admin, 200);
    
    // Supervisor deve ter acesso parcial
    await testRouteAccess('Supervisor', TEST_ROUTES.fmea.list, tokens.supervisor, 200);
    await testRouteAccess('Supervisor', TEST_ROUTES.fmea.create, tokens.supervisor, 201);
    await testRouteAccess('Supervisor', TEST_ROUTES.fmea.update, tokens.supervisor, 403);
    await testRouteAccess('Supervisor', TEST_ROUTES.fmea.delete, tokens.supervisor, 403);
    
    // Técnico deve ter acesso limitado
    await testRouteAccess('Técnico', TEST_ROUTES.fmea.list, tokens.tecnico, 200);
    await testRouteAccess('Técnico', TEST_ROUTES.fmea.create, tokens.tecnico, 403);
    await testRouteAccess('Técnico', TEST_ROUTES.fmea.update, tokens.tecnico, 403);
    await testRouteAccess('Técnico', TEST_ROUTES.fmea.delete, tokens.tecnico, 403);

    // 6.2 Testar rotas de Ordens de Serviço
    console.log(colors.cyan('\n6.2. Testando rotas de Ordens de Serviço'));
    
    // Admin deve ter acesso total
    await testRouteAccess('Admin', TEST_ROUTES.ordens.list, tokens.admin, 200);
    await testRouteAccess('Admin', TEST_ROUTES.ordens.create, tokens.admin, 201);
    
    // Supervisor deve ter acesso total
    await testRouteAccess('Supervisor', TEST_ROUTES.ordens.list, tokens.supervisor, 200);
    await testRouteAccess('Supervisor', TEST_ROUTES.ordens.create, tokens.supervisor, 201);
    
    // Técnico deve ter acesso limitado
    await testRouteAccess('Técnico', TEST_ROUTES.ordens.list, tokens.tecnico, 200);
    await testRouteAccess('Técnico', TEST_ROUTES.ordens.create, tokens.tecnico, 403);

    // 6.3 Testar acesso sem autenticação
    console.log(colors.cyan('\n6.3. Testando acesso sem autenticação'));
    api.defaults.headers.common['Authorization'] = '';
    
    await testRouteAccess('Sem auth', TEST_ROUTES.fmea.list, '', 401);
    await testRouteAccess('Sem auth', TEST_ROUTES.ordens.list, '', 401);

    // 6.4 Testar acesso com token inválido
    console.log(colors.cyan('\n6.4. Testando acesso com token inválido'));
    api.defaults.headers.common['Authorization'] = 'Bearer invalid_token';
    
    await testRouteAccess('Token inválido', TEST_ROUTES.fmea.list, 'invalid_token', 401);
    await testRouteAccess('Token inválido', TEST_ROUTES.ordens.list, 'invalid_token', 401);

    console.log(colors.yellow('\n✨ Testes concluídos com sucesso!\n'));

  } catch (error) {
    console.error(colors.red('\n❌ Erro durante os testes:'), error);
  } finally {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    if (server) {
      server.close();
      console.log(colors.gray('\n✓ Servidor de teste encerrado'));
    }
  }
}

// Executar testes
runTests();