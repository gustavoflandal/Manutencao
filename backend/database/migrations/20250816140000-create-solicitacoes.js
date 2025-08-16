'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('solicitacoes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      numero: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      titulo: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      categoria: {
        type: Sequelize.ENUM('predial', 'industrial', 'ti', 'infraestrutura'),
        allowNull: false
      },
      subcategoria: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'normal', 'alta', 'critica'),
        allowNull: false,
        defaultValue: 'normal'
      },
      status: {
        type: Sequelize.ENUM('aberta', 'em_analise', 'aprovada', 'em_execucao', 'fechada', 'cancelada'),
        allowNull: false,
        defaultValue: 'aberta'
      },
      localizacao: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      observacoes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      data_prevista: {
        type: Sequelize.DATE,
        allowNull: true
      },
      data_fechamento: {
        type: Sequelize.DATE,
        allowNull: true
      },
      solicitante_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      responsavel_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Criar índices
    await queryInterface.addIndex('solicitacoes', ['numero'], {
      name: 'idx_solicitacoes_numero'
    });

    await queryInterface.addIndex('solicitacoes', ['status'], {
      name: 'idx_solicitacoes_status'
    });

    await queryInterface.addIndex('solicitacoes', ['categoria'], {
      name: 'idx_solicitacoes_categoria'
    });

    await queryInterface.addIndex('solicitacoes', ['prioridade'], {
      name: 'idx_solicitacoes_prioridade'
    });

    await queryInterface.addIndex('solicitacoes', ['solicitante_id'], {
      name: 'idx_solicitacoes_solicitante_id'
    });

    await queryInterface.addIndex('solicitacoes', ['responsavel_id'], {
      name: 'idx_solicitacoes_responsavel_id'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remover índices
    await queryInterface.removeIndex('solicitacoes', 'idx_solicitacoes_numero');
    await queryInterface.removeIndex('solicitacoes', 'idx_solicitacoes_status');
    await queryInterface.removeIndex('solicitacoes', 'idx_solicitacoes_categoria');
    await queryInterface.removeIndex('solicitacoes', 'idx_solicitacoes_prioridade');
    await queryInterface.removeIndex('solicitacoes', 'idx_solicitacoes_solicitante_id');
    await queryInterface.removeIndex('solicitacoes', 'idx_solicitacoes_responsavel_id');
    
    // Remover tabela
    await queryInterface.dropTable('solicitacoes');
  }
};