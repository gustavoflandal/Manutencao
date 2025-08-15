const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root'
    });
    
    console.log('✅ Conectado com sucesso ao MySQL na porta 3606!');
    
    // Teste de criação do banco
    await connection.execute('CREATE DATABASE IF NOT EXISTS manutencao_db');
    console.log('✅ Banco de dados criado/verificado com sucesso!');
    
    await connection.end();
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
    console.log('Código do erro:', error.code);
  }
}

testConnection();
