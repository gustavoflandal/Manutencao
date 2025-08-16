'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subcategories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nome: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    await queryInterface.addIndex('subcategories', ['nome', 'category_id'], {
      unique: true,
      name: 'subcategories_nome_category_unique'
    });

    await queryInterface.addIndex('subcategories', ['category_id'], {
      name: 'subcategories_category_id_index'
    });

    await queryInterface.addIndex('subcategories', ['ativo'], {
      name: 'subcategories_ativo_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('subcategories');
  }
};