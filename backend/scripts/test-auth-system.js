const axios = require('axios');
const colors = require('colors/safe');
const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const routes = require('../routes');
const errorHandler = require('../middleware/errorHandler');
const logger = require('../config/logger');
const http = require('http');
const jwt = require('jsonwebtoken');

// Configuração do servidor de teste
const setupTestServer = () => {
  const app = express();
  
  // Configuração de segurança básica
  app.use(helmet());
  
  // Configuração do CORS
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  
  // Parse de JSON
  app.use(express.json());
  
  // Compressão de respostas
  app.use(compression());
  
  // Rotas da API
  app.use('/api', routes);
  
  // Tratamento de erros
  app.use(errorHandler);
  
  return app;
};

// Configuração
const PORT = 3001;
const API_URL = `http://localhost:${PORT}/api`;
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
    // Desabilitar verificação de chaves estrangeiras
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Lista de todas as tabelas que precisam ser limpas
    const tables = [
      'workflow_acoes',
      'workflow_instancias',
      'workflows',
      'user_permissions',
      'permissions',
      'ordem_servico_imagens',
      'ordem_servico_materiais',
      'ordens_servico',
      'solicitacoes',
      'movimentacao_estoques',
      'subcategories',
      'categories',
      'ativos',
      'setores',
      'users'
    ];

    // Limpar cada tabela
    for (const table of tables) {
      try {
        await sequelize.query(`TRUNCATE TABLE ${table}`);
        console.log(colors.green(`✓ Tabela ${table} limpa com sucesso`));
      } catch (error) {
        console.log(colors.yellow(`⚠️ Tabela ${table} não encontrada ou não pode ser limpa`));
      }
    }

    // Reabilitar verificação de chaves estrangeiras
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

// Função para gerar um token expirado
const generateExpiredToken = (user, secret = process.env.JWT_SECRET || 'your-secret-key') => {
  const payload = {
    id: user.id,
    email: user.email,
    perfil: user.perfil,
    iat: Math.floor(Date.now() / 1000) - 3600, // 1 hora atrás
    exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutos atrás
    aud: 'sistema-manutencao-users',
    iss: 'sistema-manutencao'
  };
  return jwt.sign(payload, secret);
};

// Testes
async function runTests() {
  let server;

  try {
    console.log(colors.yellow('\n🚀 Iniciando testes do sistema de autenticação e permissões...\n'));

    // 0. Iniciar o servidor
    console.log(colors.cyan('0. Iniciando servidor de teste...'));
    const app = setupTestServer();
    server = http.createServer(app);
    server.listen(PORT);
    
    // Esperar o servidor estar pronto
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
    const permissions = {
      viewFmea: await createTestPermission('view_fmea', 'fmea', 'view'),
      createFmea: await createTestPermission('create_fmea', 'fmea', 'create'),
      editFmea: await createTestPermission('edit_fmea', 'fmea', 'edit')
    };

    // 4. Atribuir permissões
    console.log(colors.cyan('\n4. Atribuindo permissões...'));
    if (users.admin) {
      await assignPermission(users.tecnico, permissions.viewFmea);
      await assignPermission(users.supervisor, permissions.viewFmea);
      await assignPermission(users.supervisor, permissions.createFmea);
    }

    // 5. Testar autenticação
    console.log(colors.cyan('\n5. Testando autenticação...'));
    
    // 5.1 Login inicial
    console.log(colors.cyan('\n5.1. Login inicial'));
    const loginResponse = await api.post('/auth/login', {
      email: TEST_USERS.admin.email,
      senha: TEST_USERS.admin.senha
    });
    
    if (loginResponse.status === 200 && loginResponse.data.data && loginResponse.data.data.accessToken) {
      console.log(colors.green('✓ Login com sucesso'));
      api.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.data.accessToken}`;

      // Testar acesso a rota protegida
      const userResponse = await api.get('/users/profile');
      if (userResponse.status === 200) {
        console.log(colors.green('✓ Acesso a rota protegida com sucesso'));
      } else {
        console.log(colors.red('✗ Falha no acesso a rota protegida'));
      }

      // 5.2 Testar token expirado
      console.log(colors.cyan('\n5.2. Testando token expirado'));
      const expiredToken = generateExpiredToken(loginResponse.data.data.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${expiredToken}`;
      
      const expiredResponse = await api.get('/users/profile');
      if (expiredResponse.status === 401) {
        console.log(colors.green('✓ Token expirado rejeitado corretamente'));
      } else {
        console.log(colors.red('✗ Falha ao rejeitar token expirado'));
      }

      // 5.3 Testar renovação de token
      console.log(colors.cyan('\n5.3. Testando renovação de token'));
      const refreshResponse = await api.post('/auth/refresh', {
        refreshToken: loginResponse.data.data.refreshToken
      });

      if (refreshResponse.status === 200 && refreshResponse.data.data && refreshResponse.data.data.accessToken) {
        console.log(colors.green('✓ Token renovado com sucesso'));
        api.defaults.headers.common['Authorization'] = `Bearer ${refreshResponse.data.data.accessToken}`;

        // Testar novo token
        const newTokenResponse = await api.get('/users/profile');
        if (newTokenResponse.status === 200) {
          console.log(colors.green('✓ Novo token funcionando corretamente'));
        } else {
          console.log(colors.red('✗ Falha ao usar novo token'));
        }
      } else {
        console.log(colors.red('✗ Falha ao renovar token'));
      }

      // 5.4 Testar refresh token expirado
      console.log(colors.cyan('\n5.4. Testando refresh token expirado'));
      const expiredRefreshToken = generateExpiredToken(loginResponse.data.data.user);
      
      const expiredRefreshResponse = await api.post('/auth/refresh', {
        refreshToken: expiredRefreshToken
      });

      if (expiredRefreshResponse.status === 401) {
        console.log(colors.green('✓ Refresh token expirado rejeitado corretamente'));
      } else {
        console.log(colors.red('✗ Falha ao rejeitar refresh token expirado'));
      }

    } else {
      console.log(colors.red('✗ Falha no login'));
      console.log(colors.gray('Resposta:', JSON.stringify(loginResponse.data, null, 2)));
    }

    console.log(colors.yellow('\n✨ Testes concluídos com sucesso!\n'));

  } catch (error) {
    console.error(colors.red('\n❌ Erro durante os testes:'), error);
  } finally {
    // Garantir que as chaves estrangeiras sejam reabilitadas
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Encerrar o servidor
    if (server) {
      server.close();
      console.log(colors.gray('\n✓ Servidor de teste encerrado'));
    }
  }
}

// Executar testes
runTests();