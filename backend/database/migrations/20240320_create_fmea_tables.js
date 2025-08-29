module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Criar tabela FMEA
    await queryInterface.createTable('fmea_analysis', {
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
        }
      },
      analyst_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      component: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      function: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      failure_mode: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      failure_effect: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      failure_cause: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      current_controls: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      severity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      occurrence: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      detection: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      rpn: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'review', 'approved', 'archived'),
        defaultValue: 'draft'
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

    // Criar tabela de ações do FMEA
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
          model: 'fmea_analysis',
          key: 'id'
        }
      },
      description: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      responsible_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      completion_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      comments: {
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
    await queryInterface.addIndex('fmea_analysis', ['equipment_id']);
    await queryInterface.addIndex('fmea_analysis', ['analyst_id']);
    await queryInterface.addIndex('fmea_analysis', ['status']);
    await queryInterface.addIndex('fmea_analysis', ['deleted_at']);
    await queryInterface.addIndex('fmea_actions', ['fmea_id']);
    await queryInterface.addIndex('fmea_actions', ['responsible_id']);
    await queryInterface.addIndex('fmea_actions', ['status']);
    await queryInterface.addIndex('fmea_actions', ['deleted_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('fmea_actions');
    await queryInterface.dropTable('fmea_analysis');
  }
};
