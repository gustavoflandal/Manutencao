'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tabela de Análise FMEA
    await queryInterface.createTable('fmea_analyses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      equipment_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'equipments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      component: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      function: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      failure_mode: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      failure_effect: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      failure_cause: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      current_controls: {
        type: Sequelize.TEXT
      },
      severity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10
        }
      },
      occurrence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10
        }
      },
      detection: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10
        }
      },
      rpn: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      recommended_actions: {
        type: Sequelize.TEXT
      },
      responsible: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      target_date: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.ENUM('open', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'open'
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
      },
      updated_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Tabela de Histórico de Ações FMEA
    await queryInterface.createTable('fmea_actions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fmea_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'fmea_analyses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action_taken: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      new_severity: {
        type: Sequelize.INTEGER,
        validate: {
          min: 1,
          max: 10
        }
      },
      new_occurrence: {
        type: Sequelize.INTEGER,
        validate: {
          min: 1,
          max: 10
        }
      },
      new_detection: {
        type: Sequelize.INTEGER,
        validate: {
          min: 1,
          max: 10
        }
      },
      new_rpn: {
        type: Sequelize.INTEGER
      },
      completed_date: {
        type: Sequelize.DATE
      },
      completed_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Índices para melhor performance
    await queryInterface.addIndex('fmea_analyses', ['equipment_id']);
    await queryInterface.addIndex('fmea_analyses', ['status']);
    await queryInterface.addIndex('fmea_analyses', ['rpn']);
    await queryInterface.addIndex('fmea_actions', ['fmea_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('fmea_actions');
    await queryInterface.dropTable('fmea_analyses');
  }
};
