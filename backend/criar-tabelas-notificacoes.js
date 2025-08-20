const { sequelize } = require('./models');

async function criarTabelasNotificacoes() {
  try {
    console.log('Criando tabelas de notificações...');

    // SQL para criar tabela de notificações
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo ENUM('info', 'success', 'warning', 'error', 'sistema', 'ordem_criada', 'ordem_atualizada', 'manutencao_vencida', 'ativo_problema', 'estoque_baixo') NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        prioridade ENUM('baixa', 'normal', 'alta', 'critica') NOT NULL DEFAULT 'normal',
        user_id INT NULL,
        remetente_id INT NULL,
        lida BOOLEAN NOT NULL DEFAULT FALSE,
        data_leitura DATETIME NULL,
        entregue BOOLEAN NOT NULL DEFAULT FALSE,
        data_entrega DATETIME NULL,
        link VARCHAR(500) NULL,
        setor_id INT NULL,
        categoria VARCHAR(100) NULL,
        metadata JSON NULL,
        data_expiracao DATETIME NULL,
        enviar_email BOOLEAN NOT NULL DEFAULT FALSE,
        email_enviado BOOLEAN NOT NULL DEFAULT FALSE,
        data_email_enviado DATETIME NULL,
        tentativas_email INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_remetente_id (remetente_id),
        INDEX idx_tipo (tipo),
        INDEX idx_prioridade (prioridade),
        INDEX idx_lida (lida),
        INDEX idx_created_at (created_at),
        INDEX idx_data_expiracao (data_expiracao),
        INDEX idx_setor_id (setor_id),
        INDEX idx_categoria (categoria),
        INDEX idx_user_lida_created (user_id, lida, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // SQL para criar tabela de configurações de notificação
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS configuracoes_notificacao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        notificacoes_sistema BOOLEAN NOT NULL DEFAULT TRUE,
        notificacoes_ordens BOOLEAN NOT NULL DEFAULT TRUE,
        notificacoes_manutencao BOOLEAN NOT NULL DEFAULT TRUE,
        notificacoes_ativos BOOLEAN NOT NULL DEFAULT TRUE,
        notificacoes_estoque BOOLEAN NOT NULL DEFAULT TRUE,
        email_sistema BOOLEAN NOT NULL DEFAULT FALSE,
        email_ordens BOOLEAN NOT NULL DEFAULT TRUE,
        email_manutencao BOOLEAN NOT NULL DEFAULT TRUE,
        email_ativos BOOLEAN NOT NULL DEFAULT TRUE,
        email_estoque BOOLEAN NOT NULL DEFAULT FALSE,
        prioridade_minima_notificacao ENUM('baixa', 'normal', 'alta', 'critica') NOT NULL DEFAULT 'normal',
        prioridade_minima_email ENUM('baixa', 'normal', 'alta', 'critica') NOT NULL DEFAULT 'alta',
        horario_inicio_notificacoes TIME NULL,
        horario_fim_notificacoes TIME NULL,
        frequencia_resumo_email ENUM('nunca', 'diario', 'semanal', 'mensal') NOT NULL DEFAULT 'nunca',
        pausar_notificacoes BOOLEAN NOT NULL DEFAULT FALSE,
        pausar_ate DATETIME NULL,
        setores_interesse JSON NULL,
        tipos_ativo_interesse JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id_unique (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Tabelas de notificações criadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const [notificacoesResult] = await sequelize.query("SHOW TABLES LIKE 'notificacoes'");
    const [configResult] = await sequelize.query("SHOW TABLES LIKE 'configuracoes_notificacao'");
    
    console.log('Tabela notificacoes:', notificacoesResult.length > 0 ? 'CRIADA' : 'NÃO ENCONTRADA');
    console.log('Tabela configuracoes_notificacao:', configResult.length > 0 ? 'CRIADA' : 'NÃO ENCONTRADA');
    
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    await sequelize.close();
    console.log('Conexão fechada.');
  }
}

criarTabelasNotificacoes();