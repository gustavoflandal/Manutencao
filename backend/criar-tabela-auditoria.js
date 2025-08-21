const { sequelize } = require('./models');

async function criarTabelaAuditoria() {
  try {
    console.log('🔧 Criando tabela de auditoria...\n');

    // Criar tabela de logs_operacoes diretamente
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS logs_operacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        operacao VARCHAR(100) NOT NULL COMMENT 'Tipo de operação: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, etc.',
        modulo VARCHAR(50) NOT NULL COMMENT 'Módulo do sistema: ATIVOS, USUARIOS, CATEGORIAS, etc.',
        descricao TEXT NOT NULL COMMENT 'Descrição detalhada da operação realizada',
        
        usuario_id INT NULL COMMENT 'ID do usuário que executou a operação',
        usuario_nome VARCHAR(200) NULL COMMENT 'Nome do usuário (snapshot para auditoria)',
        usuario_email VARCHAR(200) NULL COMMENT 'Email do usuário (snapshot para auditoria)',
        
        ip_address VARCHAR(45) NULL COMMENT 'Endereço IP do usuário',
        user_agent TEXT NULL COMMENT 'User Agent do navegador',
        sessao_id VARCHAR(255) NULL COMMENT 'ID da sessão',
        
        recurso_tipo VARCHAR(50) NULL COMMENT 'Tipo do recurso afetado: ativo, usuario, categoria, etc.',
        recurso_id INT NULL COMMENT 'ID do recurso afetado',
        recurso_codigo VARCHAR(100) NULL COMMENT 'Código/identificador do recurso (ex: codigo_patrimonio)',
        
        estado_anterior JSON NULL COMMENT 'Estado do recurso antes da operação',
        estado_novo JSON NULL COMMENT 'Estado do recurso após a operação',
        
        sucesso BOOLEAN NOT NULL DEFAULT true COMMENT 'Se a operação foi executada com sucesso',
        erro_detalhes TEXT NULL COMMENT 'Detalhes do erro caso a operação tenha falhado',
        
        duracao_ms INT NULL COMMENT 'Duração da operação em milissegundos',
        endpoint VARCHAR(255) NULL COMMENT 'Endpoint da API chamado',
        metodo_http VARCHAR(10) NULL COMMENT 'Método HTTP: GET, POST, PUT, DELETE',
        parametros JSON NULL COMMENT 'Parâmetros enviados na operação (sem dados sensíveis)',
        
        nivel_risco ENUM('BAIXO', 'MEDIO', 'ALTO', 'CRITICO') DEFAULT 'BAIXO' COMMENT 'Nível de risco da operação para auditoria',
        
        observacoes TEXT NULL COMMENT 'Observações adicionais sobre a operação',
        
        data_operacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora da operação',
        
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_logs_usuario_id (usuario_id),
        INDEX idx_logs_operacao (operacao),
        INDEX idx_logs_modulo (modulo),
        INDEX idx_logs_data_operacao (data_operacao),
        INDEX idx_logs_recurso (recurso_tipo, recurso_id),
        INDEX idx_logs_nivel_risco (nivel_risco),
        INDEX idx_logs_sucesso (sucesso),
        INDEX idx_logs_ip_address (ip_address)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabela logs_operacoes criada com sucesso!');

    // Testar inserção
    console.log('\n🧪 Testando inserção de log...');
    await sequelize.query(`
      INSERT INTO logs_operacoes (
        operacao, modulo, descricao, usuario_nome, usuario_email, 
        nivel_risco, observacoes, data_operacao
      ) VALUES (
        'CREATE', 'SISTEMA', 'Teste de configuração do sistema de auditoria',
        'Sistema', 'sistema@manutencao.com', 'BAIXO',
        'Log de teste criado durante configuração inicial', NOW()
      )
    `);

    console.log('✅ Log de teste inserido com sucesso!');

    // Verificar se funcionou
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as total FROM logs_operacoes
    `);

    console.log(`📊 Total de logs na tabela: ${results[0].total}`);

    console.log('\n🎉 Sistema de auditoria configurado com sucesso!');
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
    console.error('❌ Erro ao criar tabela de auditoria:', error);
    process.exit(1);
  }
}

criarTabelaAuditoria();