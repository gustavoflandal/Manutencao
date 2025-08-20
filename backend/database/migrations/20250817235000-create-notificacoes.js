'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Criar tabela de notificações
    await queryInterface.createTable('notificacoes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tipo: {
        type: Sequelize.ENUM('info', 'success', 'warning', 'error', 'sistema', 'ordem_criada', 'ordem_atualizada', 'manutencao_vencida', 'ativo_problema', 'estoque_baixo'),
        allowNull: false
      },
      titulo: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      mensagem: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'normal', 'alta', 'critica'),
        allowNull: false,
        defaultValue: 'normal'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      remetente_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      lida: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      data_leitura: {
        type: Sequelize.DATE,
        allowNull: true
      },
      entregue: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      data_entrega: {
        type: Sequelize.DATE,
        allowNull: true
      },
      link: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      setor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'setores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      categoria: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      data_expiracao: {
        type: Sequelize.DATE,
        allowNull: true
      },
      enviar_email: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_enviado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      data_email_enviado: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tentativas_email: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Criar tabela de configurações de notificação
    await queryInterface.createTable('configuracoes_notificacao', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      notificacoes_sistema: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notificacoes_ordens: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notificacoes_manutencao: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notificacoes_ativos: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notificacoes_estoque: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      email_sistema: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_ordens: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      email_manutencao: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      email_ativos: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      email_estoque: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      prioridade_minima_notificacao: {
        type: Sequelize.ENUM('baixa', 'normal', 'alta', 'critica'),
        allowNull: false,
        defaultValue: 'normal'
      },
      prioridade_minima_email: {
        type: Sequelize.ENUM('baixa', 'normal', 'alta', 'critica'),
        allowNull: false,
        defaultValue: 'alta'
      },
      horario_inicio_notificacoes: {
        type: Sequelize.TIME,
        allowNull: true
      },
      horario_fim_notificacoes: {
        type: Sequelize.TIME,
        allowNull: true
      },
      frequencia_resumo_email: {
        type: Sequelize.ENUM('nunca', 'diario', 'semanal', 'mensal'),
        allowNull: false,
        defaultValue: 'nunca'
      },
      pausar_notificacoes: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pausar_ate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      setores_interesse: {
        type: Sequelize.JSON,
        allowNull: true
      },
      tipos_ativo_interesse: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Criar índices para otimização
    await queryInterface.addIndex('notificacoes', ['user_id']);
    await queryInterface.addIndex('notificacoes', ['remetente_id']);
    await queryInterface.addIndex('notificacoes', ['tipo']);
    await queryInterface.addIndex('notificacoes', ['prioridade']);
    await queryInterface.addIndex('notificacoes', ['lida']);
    await queryInterface.addIndex('notificacoes', ['created_at']);
    await queryInterface.addIndex('notificacoes', ['data_expiracao']);
    await queryInterface.addIndex('notificacoes', ['setor_id']);
    await queryInterface.addIndex('notificacoes', ['categoria']);

    // Índice composto para busca eficiente de notificações não lidas por usuário
    await queryInterface.addIndex('notificacoes', ['user_id', 'lida', 'created_at']);

    // Índice para notificações globais
    await queryInterface.addIndex('notificacoes', ['user_id', 'tipo', 'prioridade'], {
      where: {
        user_id: null
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('configuracoes_notificacao');
    await queryInterface.dropTable('notificacoes');
  }
};