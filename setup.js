const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function testDatabaseConnection(config) {
  try {
    // Tenta conectar diretamente ao banco manutencao
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: 'manutencao'
    });
    await connection.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function setup() {
  console.log('🚀 Iniciando configuração do sistema...\n');

  // 1. Verificar conexão com o banco
  console.log('📊 Verificando conexão com o banco de dados...');
  
  let dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: ''
  };

  // Tentar conexão inicial sem senha
  let isConnected = await testDatabaseConnection(dbConfig);
  
  if (!isConnected) {
    // Solicitar senha do MySQL
    dbConfig.password = await question('Digite a senha do MySQL: ');
    isConnected = await testDatabaseConnection(dbConfig);

    if (!isConnected) {
      console.error('❌ Não foi possível conectar ao banco de dados. Verifique se:');
      console.error('1. O MySQL está rodando');
      console.error('2. O banco "manutencao" existe');
      console.error('3. As credenciais estão corretas');
      rl.close();
      return;
    }
  }

  console.log('✅ Conectado ao banco de dados com sucesso');

  try {
    // 2. Atualizar config.json
    console.log('\n📝 Atualizando configuração do banco de dados...');
    const configContent = {
      development: {
        username: dbConfig.user,
        password: dbConfig.password,
        database: "manutencao",
        host: dbConfig.host,
        dialect: "mysql"
      },
      test: {
        username: dbConfig.user,
        password: dbConfig.password,
        database: "manutencao_test",
        host: dbConfig.host,
        dialect: "mysql"
      },
      production: {
        username: dbConfig.user,
        password: dbConfig.password,
        database: "manutencao_prod",
        host: dbConfig.host,
        dialect: "mysql"
      }
    };

    fs.writeFileSync(
      path.join(__dirname, 'backend/config/config.json'),
      JSON.stringify(configContent, null, 2)
    );
    console.log('✅ Arquivo config.json atualizado com sucesso');

    // 3. Instalar dependências
    console.log('\n📦 Instalando dependências...');
    
    // Backend
    console.log('\nInstalando dependências do Backend:');
    execSync('cd backend && npm install', { stdio: 'inherit' });
    
    // Frontend
    console.log('\nInstalando dependências do Frontend:');
    execSync('cd frontend && npm install', { stdio: 'inherit' });

    // 4. Executar migrações
    console.log('\n🔄 Executando migrações do banco de dados...');
    execSync('cd backend && npx sequelize-cli db:migrate', { stdio: 'inherit' });

    console.log('\n✨ Configuração concluída com sucesso!');
    console.log('\nPara iniciar o sistema:');
    console.log('1. Em um terminal: cd backend && npm run dev');
    console.log('2. Em outro terminal: cd frontend && npm run dev');
    console.log('\nAcesse: http://localhost:5173');
    console.log('Login: admin@sistema.com');
    console.log('Senha: 123456');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  } finally {
    rl.close();
  }
}

setup();