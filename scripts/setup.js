const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mysql = require('mysql2');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('🚀 Iniciando configuração do sistema...\n');

  // 1. Verificar MySQL
  console.log('📊 Verificando MySQL...');
  const dbConfig = {
    host: '127.0.0.1',
    user: 'root'
  };

  // Solicitar senha do MySQL
  dbConfig.password = await question('Digite a senha do MySQL (deixe em branco se não houver): ');
  
  try {
    // Tentar conexão
    const connection = mysql.createConnection(dbConfig);
    
    // Criar banco se não existir
    connection.query('CREATE DATABASE IF NOT EXISTS manutencao');
    console.log('✅ Banco de dados criado/verificado com sucesso');
    
    connection.end();

    // 2. Configurar arquivo .env
    console.log('\n📝 Configurando variáveis de ambiente...');
    const envContent = `NODE_ENV=development
PORT=3001
JWT_SECRET=${Math.random().toString(36).slice(-20)}
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=${dbConfig.password}
DB_NAME=manutencao
CORS_ORIGIN=http://localhost:5173`;

    fs.writeFileSync(path.join(__dirname, '../backend/.env'), envContent);
    console.log('✅ Arquivo .env criado com sucesso');

    // 3. Atualizar config.json
    console.log('\n📝 Atualizando configuração do banco de dados...');
    const configContent = {
      development: {
        username: "root",
        password: dbConfig.password,
        database: "manutencao",
        host: "127.0.0.1",
        dialect: "mysql"
      },
      test: {
        username: "root",
        password: dbConfig.password,
        database: "manutencao_test",
        host: "127.0.0.1",
        dialect: "mysql"
      },
      production: {
        username: "root",
        password: dbConfig.password,
        database: "manutencao_prod",
        host: "127.0.0.1",
        dialect: "mysql"
      }
    };

    fs.writeFileSync(
      path.join(__dirname, '../backend/config/config.json'),
      JSON.stringify(configContent, null, 2)
    );
    console.log('✅ Arquivo config.json atualizado com sucesso');

    // 4. Instalar dependências
    console.log('\n📦 Instalando dependências...');
    console.log('\nBackend:');
    execSync('cd backend && npm install', { stdio: 'inherit' });
    console.log('\nFrontend:');
    execSync('cd frontend && npm install', { stdio: 'inherit' });

    // 5. Executar migrações
    console.log('\n🔄 Executando migrações do banco de dados...');
    execSync('cd backend && npx sequelize-cli db:migrate', { stdio: 'inherit' });

    // 6. Criar usuário admin
    console.log('\n👤 Criando usuário administrador...');
    const adminPassword = await question('Digite a senha para o usuário admin (mínimo 6 caracteres): ');
    
    const createAdminScript = `
    const { User } = require('./models');
    const bcrypt = require('bcryptjs');

    async function createAdmin() {
      try {
        await User.create({
          nome: 'Administrador',
          email: 'admin@sistema.com',
          senha: await bcrypt.hash('${adminPassword}', 10),
          perfil: 'administrador'
        });
        console.log('✅ Usuário admin criado com sucesso');
        process.exit(0);
      } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error);
        process.exit(1);
      }
    }

    createAdmin();
    `;

    fs.writeFileSync(path.join(__dirname, '../backend/create-admin.js'), createAdminScript);
    execSync('cd backend && node create-admin.js', { stdio: 'inherit' });

    console.log('\n✨ Configuração concluída com sucesso!');
    console.log('\nPara iniciar o sistema:');
    console.log('1. Em um terminal: cd backend && npm run dev');
    console.log('2. Em outro terminal: cd frontend && npm run dev');
    console.log('\nAcesse: http://localhost:5173');
    console.log('Login: admin@sistema.com');
    console.log(`Senha: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  } finally {
    rl.close();
  }
}

setup();

