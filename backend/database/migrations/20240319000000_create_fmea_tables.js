'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Criar tabela fmea_analyses
    await queryInterface.createTable('fmea_analyses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      equipment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ativos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      analyst_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      component: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Nome do componente analisado'
      },
      function: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Função do componente'
      },
      failure_mode: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Modo de falha'
      },
      failure_effect: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Efeito da falha'
      },
      failure_cause: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Causa da falha'
      },
      current_controls: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Controles atuais'
      },
      severity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10
        },
        comment: 'Severidade (1-10)'
      },
      occurrence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10
        },
        comment: 'Ocorrência (1-10)'
      },
      detection: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10
        },
        comment: 'Detecção (1-10)'
      },
      rpn: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Risk Priority Number (Severidade x Ocorrência x Detecção)'
      },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      review_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Data da próxima revisão'
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

    // Criar tabela fmea_actions
    await queryInterface.createTable('fmea_actions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fmea_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fmea_analyses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      responsible_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Descrição da ação recomendada'
      },
      type: {
        type: Sequelize.ENUM('preventive', 'corrective', 'detective'),
        allowNull: false,
        defaultValue: 'preventive',
        comment: 'Tipo de ação'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Prioridade da ação'
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Status da ação'
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Data limite para conclusão'
      },
      completion_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Data de conclusão'
      },
      completion_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Observações sobre a conclusão'
      },
      effectiveness: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 10
        },
        comment: 'Eficácia da ação (1-10)'
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
    await queryInterface.addIndex('fmea_analyses', ['equipment_id']);
    await queryInterface.addIndex('fmea_analyses', ['analyst_id']);
    await queryInterface.addIndex('fmea_analyses', ['rpn']);
    await queryInterface.addIndex('fmea_analyses', ['status']);
    await queryInterface.addIndex('fmea_actions', ['fmea_id']);
    await queryInterface.addIndex('fmea_actions', ['responsible_id']);
    await queryInterface.addIndex('fmea_actions', ['status']);
    await queryInterface.addIndex('fmea_actions', ['due_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('fmea_actions');
    await queryInterface.dropTable('fmea_analyses');
  }
};
