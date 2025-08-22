const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar se a tabela já existe para evitar erro de duplicidade
    const tableExists = await queryInterface.sequelize.query("SHOW TABLES LIKE 'logs_operacoes'");
    if (tableExists[0] && tableExists[0].length > 0) {
      // Opcional: garantir que colunas obrigatórias existam (pular para índices)
      // Prosseguir apenas criando índices ausentes
    } else {
      await queryInterface.createTable('logs_operacoes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      
      // Identificação da operação
      operacao: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Tipo de operação: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, etc.'
      },
      modulo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Módulo do sistema: ATIVOS, USUARIOS, CATEGORIAS, etc.'
      },
      descricao: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Descrição detalhada da operação realizada'
      },
      
      // Dados do usuário
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID do usuário que executou a operação'
      },
      usuario_nome: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Nome do usuário (snapshot para auditoria)'
      },
      usuario_email: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Email do usuário (snapshot para auditoria)'
      },
      
      // Dados da sessão
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'Endereço IP do usuário'
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'User Agent do navegador'
      },
      sessao_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'ID da sessão'
      },
      
      // Dados da operação
      recurso_tipo: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Tipo do recurso afetado: ativo, usuario, categoria, etc.'
      },
      recurso_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID do recurso afetado'
      },
      recurso_codigo: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Código/identificador do recurso (ex: codigo_patrimonio)'
      },
      
      // Estado antes e depois (para updates)
      estado_anterior: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Estado do recurso antes da operação'
      },
      estado_novo: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Estado do recurso após a operação'
      },
      
      // Resultado da operação
      sucesso: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Se a operação foi executada com sucesso'
      },
      erro_detalhes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detalhes do erro caso a operação tenha falhado'
      },
      
      // Metadados
      duracao_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duração da operação em milissegundos'
      },
      endpoint: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Endpoint da API chamado'
      },
      metodo_http: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Método HTTP: GET, POST, PUT, DELETE'
      },
      parametros: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Parâmetros enviados na operação (sem dados sensíveis)'
      },
      
      // Classificação de risco
      nivel_risco: {
        type: DataTypes.ENUM('BAIXO', 'MEDIO', 'ALTO', 'CRITICO'),
        defaultValue: 'BAIXO',
        comment: 'Nível de risco da operação para auditoria'
      },
      
      // Observações
      observacoes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Observações adicionais sobre a operação'
      },
      
      // Timestamp
      data_operacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Data e hora da operação'
      },
      
      // Timestamps automáticos
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    }
    // Função auxiliar para criar índice se não existir
    async function ensureIndex(name, fields) {
      try {
        await queryInterface.addIndex('logs_operacoes', fields, { name });
      } catch (err) {
        if (err && err.original && /Duplicate key name|already exists/i.test(err.original.message)) {
          // Índice já existe, ignorar
        } else {
          throw err;
        }
      }
    }

    await ensureIndex('idx_logs_usuario_id', ['usuario_id']);
    await ensureIndex('idx_logs_operacao', ['operacao']);
    await ensureIndex('idx_logs_modulo', ['modulo']);
    await ensureIndex('idx_logs_data_operacao', ['data_operacao']);
    await ensureIndex('idx_logs_recurso', ['recurso_tipo', 'recurso_id']);
    await ensureIndex('idx_logs_nivel_risco', ['nivel_risco']);
    await ensureIndex('idx_logs_sucesso', ['sucesso']);
    await ensureIndex('idx_logs_ip_address', ['ip_address']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('logs_operacoes');
  }
};