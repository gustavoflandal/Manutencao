const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Configuração da conexão com o banco
const configPath = path.join(__dirname, 'config', 'config.json');
const config = require(configPath);
const dbConfig = config.development || config;

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port || 3306,
  dialect: 'mysql',
  logging: console.log
});

async function criarTabelasWorkflow() {
  try {
    console.log('🔄 Iniciando criação das tabelas do sistema de workflow...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');
    
    // 1. Criar tabela workflows
    console.log('📋 Criando tabela workflows...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL COMMENT 'Nome do workflow',
        descricao TEXT COMMENT 'Descrição do workflow',
        tipo ENUM(
          'aprovacao_ordem_servico',
          'aprovacao_compra', 
          'aprovacao_orcamento',
          'escalacao_problema',
          'processo_manutencao',
          'aprovacao_usuario',
          'workflow_personalizado'
        ) NOT NULL COMMENT 'Tipo do workflow',
        categoria ENUM(
          'operacional',
          'financeiro', 
          'administrativo',
          'tecnico',
          'emergencial'
        ) NOT NULL COMMENT 'Categoria do workflow',
        trigger_evento ENUM(
          'criacao_ordem',
          'mudanca_status',
          'valor_limite',
          'tempo_limite', 
          'manual',
          'agendado',
          'condicional'
        ) NOT NULL COMMENT 'Evento que dispara o workflow',
        condicoes_trigger JSON COMMENT 'Condições específicas para disparar o workflow',
        estados JSON NOT NULL COMMENT 'Definição dos estados do workflow',
        transicoes JSON NOT NULL COMMENT 'Definição das transições entre estados',
        estado_inicial VARCHAR(100) NOT NULL COMMENT 'Estado inicial do workflow',
        estados_finais JSON NOT NULL COMMENT 'Estados que finalizam o workflow',
        niveis_aprovacao JSON COMMENT 'Configuração dos níveis de aprovação',
        escalacao_config JSON COMMENT 'Configuração de escalação automática',
        notificacoes_config JSON COMMENT 'Configuração de notificações do workflow',
        prazo_maximo INT COMMENT 'Prazo máximo em horas para conclusão',
        prioridade_padrao ENUM('baixa', 'normal', 'alta', 'critica') DEFAULT 'normal' COMMENT 'Prioridade padrão das instâncias',
        user_id INT NOT NULL COMMENT 'Usuário que criou o workflow',
        setor_id INT COMMENT 'Setor responsável pelo workflow',
        template BOOLEAN DEFAULT FALSE COMMENT 'Se é um template de workflow',
        publico BOOLEAN DEFAULT FALSE COMMENT 'Se o workflow é público',
        ativo BOOLEAN DEFAULT TRUE COMMENT 'Se o workflow está ativo',
        versao INT DEFAULT 1 COMMENT 'Versão do workflow',
        aprovadores_padrao JSON COMMENT 'Lista de aprovadores padrão por nível',
        campos_customizados JSON COMMENT 'Campos customizados para o workflow',
        integracao_config JSON COMMENT 'Configurações de integração com outros sistemas',
        metricas_config JSON COMMENT 'Configuração de métricas do workflow',
        backup_configuracao JSON COMMENT 'Backup da configuração anterior',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_workflows_tipo (tipo),
        INDEX idx_workflows_categoria (categoria),
        INDEX idx_workflows_trigger (trigger_evento),
        INDEX idx_workflows_usuario (user_id),
        INDEX idx_workflows_setor (setor_id),
        INDEX idx_workflows_ativo (ativo, template),
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela workflows criada');
    
    // 2. Criar tabela workflow_instancias
    console.log('📋 Criando tabela workflow_instancias...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS workflow_instancias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workflow_id INT NOT NULL COMMENT 'ID do workflow',
        numero VARCHAR(50) NOT NULL UNIQUE COMMENT 'Número único da instância',
        titulo VARCHAR(255) NOT NULL COMMENT 'Título da instância do workflow',
        descricao TEXT COMMENT 'Descrição da instância',
        estado_atual VARCHAR(100) NOT NULL COMMENT 'Estado atual do workflow',
        status ENUM(
          'ativo',
          'pausado', 
          'concluido',
          'cancelado',
          'erro',
          'expirado'
        ) DEFAULT 'ativo' COMMENT 'Status da instância',
        prioridade ENUM('baixa', 'normal', 'alta', 'critica') DEFAULT 'normal' COMMENT 'Prioridade da instância',
        user_iniciador_id INT NOT NULL COMMENT 'Usuário que iniciou o workflow',
        user_responsavel_id INT COMMENT 'Usuário responsável atual',
        aprovador_atual_id INT COMMENT 'Aprovador atual (se em processo de aprovação)',
        dados_contexto JSON COMMENT 'Dados de contexto da instância',
        campos_customizados JSON COMMENT 'Valores dos campos customizados',
        historico_estados JSON NOT NULL COMMENT 'Histórico de mudanças de estado',
        historico_aprovacoes JSON COMMENT 'Histórico de aprovações/rejeições',
        comentarios JSON COMMENT 'Comentários adicionados durante o processo',
        anexos JSON COMMENT 'Lista de anexos da instância',
        data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de início da instância',
        data_conclusao TIMESTAMP NULL COMMENT 'Data de conclusão da instância',
        prazo_limite TIMESTAMP NULL COMMENT 'Prazo limite para conclusão',
        tempo_execucao INT COMMENT 'Tempo total de execução em minutos',
        nivel_aprovacao_atual INT COMMENT 'Nível de aprovação atual',
        escalacao_count INT DEFAULT 0 COMMENT 'Número de escalações realizadas',
        data_ultima_escalacao TIMESTAMP NULL COMMENT 'Data da última escalação',
        origem_tipo ENUM(
          'ordem_servico',
          'solicitacao',
          'ativo',
          'manual',
          'sistema',
          'agenda'
        ) COMMENT 'Tipo da origem que disparou o workflow',
        origem_id INT COMMENT 'ID do registro que originou o workflow',
        resultado_final TEXT COMMENT 'Resultado final da execução',
        metricas JSON COMMENT 'Métricas coletadas durante a execução',
        notificacoes_enviadas JSON COMMENT 'Log de notificações enviadas',
        configuracao_snapshot JSON COMMENT 'Snapshot da configuração do workflow no momento da execução',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_workflow_instancias_workflow (workflow_id),
        INDEX idx_workflow_instancias_estado (estado_atual),
        INDEX idx_workflow_instancias_status (status),
        INDEX idx_workflow_instancias_prioridade (prioridade),
        INDEX idx_workflow_instancias_usuario_iniciador (user_iniciador_id),
        INDEX idx_workflow_instancias_responsavel (user_responsavel_id),
        INDEX idx_workflow_instancias_aprovador (aprovador_atual_id),
        INDEX idx_workflow_instancias_numero (numero),
        INDEX idx_workflow_instancias_origem (origem_tipo, origem_id),
        INDEX idx_workflow_instancias_prazo (prazo_limite, status),
        
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE RESTRICT,
        FOREIGN KEY (user_iniciador_id) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (user_responsavel_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (aprovador_atual_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela workflow_instancias criada');
    
    // 3. Criar tabela workflow_acoes
    console.log('📋 Criando tabela workflow_acoes...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS workflow_acoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        instancia_id INT NOT NULL COMMENT 'ID da instância do workflow',
        tipo ENUM(
          'enviar_notificacao',
          'atualizar_origem',
          'definir_responsavel',
          'definir_prazo',
          'escalar_automaticamente',
          'executar_script',
          'integrar_sistema',
          'gerar_documento', 
          'agendar_tarefa',
          'validar_dados',
          'calcular_metrica',
          'backup_dados'
        ) NOT NULL COMMENT 'Tipo da ação executada',
        nome VARCHAR(255) COMMENT 'Nome descritivo da ação',
        configuracao JSON COMMENT 'Configuração específica da ação',
        status ENUM(
          'pendente',
          'executando',
          'executada',
          'erro',
          'cancelada',
          'agendada'
        ) DEFAULT 'pendente' COMMENT 'Status da execução da ação',
        user_id INT NOT NULL COMMENT 'Usuário que disparou a ação',
        data_agendamento TIMESTAMP NULL COMMENT 'Data agendada para execução',
        data_execucao TIMESTAMP NULL COMMENT 'Data de execução da ação',
        duracao_execucao INT COMMENT 'Duração da execução em milissegundos',
        resultado JSON COMMENT 'Resultado da execução da ação',
        erro TEXT COMMENT 'Mensagem de erro se houver',
        tentativas INT DEFAULT 0 COMMENT 'Número de tentativas de execução',
        max_tentativas INT DEFAULT 3 COMMENT 'Número máximo de tentativas',
        prioridade INT DEFAULT 5 COMMENT 'Prioridade da ação (1-10)',
        dependencias JSON COMMENT 'IDs de ações que devem ser executadas antes',
        contexto_execucao JSON COMMENT 'Contexto adicional para execução',
        automatica BOOLEAN DEFAULT FALSE COMMENT 'Se a ação é executada automaticamente',
        reversivel BOOLEAN DEFAULT FALSE COMMENT 'Se a ação pode ser revertida',
        dados_reversao JSON COMMENT 'Dados necessários para reverter a ação',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_workflow_acoes_instancia (instancia_id),
        INDEX idx_workflow_acoes_tipo (tipo),
        INDEX idx_workflow_acoes_status (status),
        INDEX idx_workflow_acoes_usuario (user_id),
        INDEX idx_workflow_acoes_agendamento (data_agendamento, status),
        INDEX idx_workflow_acoes_prioridade (prioridade, status),
        INDEX idx_workflow_acoes_automatica (automatica, status),
        
        FOREIGN KEY (instancia_id) REFERENCES workflow_instancias(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela workflow_acoes criada');
    
    console.log('🎉 Todas as tabelas do sistema de workflow foram criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas do workflow:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Função para popular dados iniciais
async function popularDadosIniciais() {
  try {
    console.log('🔄 Populando dados iniciais do sistema de workflow...');
    
    // Usar nova instância do Sequelize para dados iniciais
    const { Sequelize: SequelizeClass } = require('sequelize');
    const config = require('./config/config.json')[process.env.NODE_ENV || 'development'];
    
    const sequelizePopular = new SequelizeClass(config.database, config.username, config.password, {
      host: config.host,
      dialect: config.dialect,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    await sequelizePopular.authenticate();
    
    // Criar templates padrão de workflow
    console.log('📋 Criando templates padrão...');
    
    // Template de Aprovação de Ordem de Serviço
    await sequelizePopular.query(`
      INSERT IGNORE INTO workflows (
        nome, descricao, tipo, categoria, trigger_evento, user_id, template, publico, ativo,
        estado_inicial, estados_finais, estados, transicoes, condicoes_trigger, niveis_aprovacao, prazo_maximo
      ) VALUES (
        'Aprovação de Ordem de Serviço',
        'Workflow para aprovação de ordens de serviço baseado em valor',
        'aprovacao_ordem_servico',
        'operacional', 
        'criacao_ordem',
        1,
        TRUE,
        TRUE,
        TRUE,
        'criada',
        '["aprovada", "rejeitada"]',
        '[
          {"id": "criada", "nome": "Criada", "descricao": "Ordem criada aguardando aprovação"},
          {"id": "em_aprovacao", "nome": "Em Aprovação", "descricao": "Em processo de aprovação"},
          {"id": "aprovada", "nome": "Aprovada", "descricao": "Ordem aprovada"},
          {"id": "rejeitada", "nome": "Rejeitada", "descricao": "Ordem rejeitada"}
        ]',
        '[
          {"de": "criada", "para": "em_aprovacao", "titulo": "Enviar para Aprovação", "condicoes": [{"campo": "custo_estimado", "operador": "maior_que", "valor": 500}]},
          {"de": "em_aprovacao", "para": "aprovada", "titulo": "Aprovar", "permissoes_necessarias": ["aprovar_ordens"]},
          {"de": "em_aprovacao", "para": "rejeitada", "titulo": "Rejeitar", "permissoes_necessarias": ["aprovar_ordens"], "requer_observacao": true}
        ]',
        '[{"campo": "custo_estimado", "operador": "maior_que", "valor": 500}]',
        '[
          {"nivel": 1, "valor_limite": 1000, "aprovadores": ["supervisor"]},
          {"nivel": 2, "valor_limite": 5000, "aprovadores": ["gerente"]},
          {"nivel": 3, "valor_limite": null, "aprovadores": ["diretor"]}
        ]',
        48
      )
    `);
    
    // Template de Escalação de Problema
    await sequelizePopular.query(`
      INSERT IGNORE INTO workflows (
        nome, descricao, tipo, categoria, trigger_evento, user_id, template, publico, ativo,
        estado_inicial, estados_finais, estados, transicoes, escalacao_config, prazo_maximo
      ) VALUES (
        'Escalação de Problema Crítico',
        'Workflow para escalação automática de problemas críticos',
        'escalacao_problema',
        'emergencial',
        'mudanca_status', 
        1,
        TRUE,
        TRUE,
        TRUE,
        'detectado',
        '["resolvido", "escalado_nivel_3"]',
        '[
          {"id": "detectado", "nome": "Problema Detectado", "descricao": "Problema identificado"},
          {"id": "nivel_1", "nome": "Nível 1", "descricao": "Suporte nível 1"},
          {"id": "nivel_2", "nome": "Nível 2", "descricao": "Suporte nível 2"},
          {"id": "nivel_3", "nome": "Nível 3", "descricao": "Suporte especializado"},
          {"id": "resolvido", "nome": "Resolvido", "descricao": "Problema resolvido"}
        ]',
        '[
          {"de": "detectado", "para": "nivel_1", "titulo": "Iniciar Atendimento"},
          {"de": "nivel_1", "para": "nivel_2", "titulo": "Escalar Nível 2"},
          {"de": "nivel_2", "para": "nivel_3", "titulo": "Escalar Nível 3"},
          {"de": "nivel_1", "para": "resolvido", "titulo": "Resolver"},
          {"de": "nivel_2", "para": "resolvido", "titulo": "Resolver"},
          {"de": "nivel_3", "para": "resolvido", "titulo": "Resolver"}
        ]',
        '{"tempo_nivel_1": 2, "tempo_nivel_2": 4, "automatica": true}',
        8
      )
    `);
    
    // Template de Aprovação de Compra
    await sequelizePopular.query(`
      INSERT IGNORE INTO workflows (
        nome, descricao, tipo, categoria, trigger_evento, user_id, template, publico, ativo,
        estado_inicial, estados_finais, estados, transicoes, niveis_aprovacao, prazo_maximo
      ) VALUES (
        'Aprovação de Compra',
        'Workflow para aprovação de solicitações de compra',
        'aprovacao_compra',
        'financeiro',
        'valor_limite',
        1,
        TRUE,
        TRUE,
        TRUE,
        'solicitada',
        '["aprovada", "rejeitada"]',
        '[
          {"id": "solicitada", "nome": "Solicitada", "descricao": "Compra solicitada"},
          {"id": "aprovacao_gestor", "nome": "Aprovação Gestor", "descricao": "Aguardando aprovação do gestor"},
          {"id": "aprovacao_financeiro", "nome": "Aprovação Financeiro", "descricao": "Aguardando aprovação do financeiro"},
          {"id": "aprovacao_diretoria", "nome": "Aprovação Diretoria", "descricao": "Aguardando aprovação da diretoria"},
          {"id": "aprovada", "nome": "Aprovada", "descricao": "Compra aprovada"},
          {"id": "rejeitada", "nome": "Rejeitada", "descricao": "Compra rejeitada"}
        ]',
        '[
          {"de": "solicitada", "para": "aprovacao_gestor", "titulo": "Enviar para Gestor"},
          {"de": "aprovacao_gestor", "para": "aprovacao_financeiro", "titulo": "Aprovar - Financeiro", "condicoes": [{"campo": "valor", "operador": "maior_que", "valor": 1000}]},
          {"de": "aprovacao_gestor", "para": "aprovada", "titulo": "Aprovar - Direto", "condicoes": [{"campo": "valor", "operador": "menor_que", "valor": 1000}]},
          {"de": "aprovacao_financeiro", "para": "aprovacao_diretoria", "titulo": "Escalar Diretoria", "condicoes": [{"campo": "valor", "operador": "maior_que", "valor": 10000}]},
          {"de": "aprovacao_financeiro", "para": "aprovada", "titulo": "Aprovar - Financeiro"},
          {"de": "aprovacao_diretoria", "para": "aprovada", "titulo": "Aprovar - Diretoria"},
          {"de": "aprovacao_gestor", "para": "rejeitada", "titulo": "Rejeitar"},
          {"de": "aprovacao_financeiro", "para": "rejeitada", "titulo": "Rejeitar"},
          {"de": "aprovacao_diretoria", "para": "rejeitada", "titulo": "Rejeitar"}
        ]',
        '[
          {"nivel": 1, "valor_limite": 1000, "aprovadores": ["gestor"]},
          {"nivel": 2, "valor_limite": 10000, "aprovadores": ["financeiro"]},
          {"nivel": 3, "valor_limite": null, "aprovadores": ["diretoria"]}
        ]',
        72
      )
    `);
    
    console.log('✅ Templates padrão criados');
    
    // Atualizar permissões para incluir workflows
    console.log('📋 Atualizando permissões...');
    
    const novasPermissoes = [
      'criar_workflows',
      'editar_workflows', 
      'excluir_workflows',
      'executar_workflows',
      'gerenciar_workflows',
      'aprovar_workflows',
      'visualizar_workflows'
    ];
    
    for (const permissao of novasPermissoes) {
      await sequelizePopular.query(`
        INSERT IGNORE INTO permissions (name, description, module) 
        VALUES (?, ?, 'workflows')
      `, {
        replacements: [permissao, `Permissão para ${permissao.replace('_', ' ')}`]
      });
    }
    
    console.log('✅ Permissões atualizadas');
    
    console.log('🎉 Dados iniciais do sistema de workflow populados com sucesso!');
    
    // Fechar conexão
    await sequelizePopular.close();
    
  } catch (error) {
    console.error('❌ Erro ao popular dados iniciais:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      await criarTabelasWorkflow();
      await popularDadosIniciais();
      console.log('✅ Sistema de workflow configurado completamente!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro na configuração:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  criarTabelasWorkflow,
  popularDadosIniciais
};