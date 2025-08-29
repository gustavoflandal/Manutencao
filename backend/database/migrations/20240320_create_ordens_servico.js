module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ordens_servico', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      numero_os: {
        type: Sequelize.STRING(20),
        unique: true
      },
      ativo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ativos',
          key: 'id'
        }
      },
      solicitacao_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'solicitacoes',
          key: 'id'
        }
      },
      fmea_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fmea_analysis',
          key: 'id'
        }
      },
      solicitante_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      responsavel_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      tipo: {
        type: Sequelize.ENUM('preventiva', 'corretiva', 'preditiva'),
        allowNull: false
      },
      descricao_servico: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('planejada', 'em_execucao', 'pausada', 'concluida', 'cancelada'),
        defaultValue: 'planejada'
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'media', 'alta', 'urgente'),
        defaultValue: 'media'
      },
      data_inicio_prevista: {
        type: Sequelize.DATE,
        allowNull: false
      },
      data_inicio_real: {
        type: Sequelize.DATE,
        allowNull: true
      },
      data_fim_prevista: {
        type: Sequelize.DATE,
        allowNull: false
      },
      data_fim_real: {
        type: Sequelize.DATE,
        allowNull: true
      },
      horas_planejadas: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      horas_realizadas: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      custo_total: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      observacoes_execucao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Criar índices
    await queryInterface.addIndex('ordens_servico', ['ativo_id']);
    await queryInterface.addIndex('ordens_servico', ['solicitacao_id']);
    await queryInterface.addIndex('ordens_servico', ['fmea_id']);
    await queryInterface.addIndex('ordens_servico', ['solicitante_id']);
    await queryInterface.addIndex('ordens_servico', ['responsavel_id']);
    await queryInterface.addIndex('ordens_servico', ['status']);
    await queryInterface.addIndex('ordens_servico', ['tipo']);
    await queryInterface.addIndex('ordens_servico', ['prioridade']);
    await queryInterface.addIndex('ordens_servico', ['data_inicio_prevista']);
    await queryInterface.addIndex('ordens_servico', ['data_fim_prevista']);
    await queryInterface.addIndex('ordens_servico', ['deleted_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ordens_servico');
  }
};
