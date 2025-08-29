const app = require('./app');
const logger = require('./config/logger');
const { sequelize } = require('./models');

// Inicialização
const PORT = process.env.PORT || 3001;

// Testar conexão com banco e iniciar servidor
async function startServer() {
  try {
    // Testar conexão com banco
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      logger.info(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    logger.error('Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();