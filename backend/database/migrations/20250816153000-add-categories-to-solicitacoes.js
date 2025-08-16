'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar campos para categorias
    await queryInterface.addColumn('solicitacoes', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Permitir null durante a transição
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('solicitacoes', 'subcategory_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'subcategories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Criar índices
    await queryInterface.addIndex('solicitacoes', ['category_id'], {
      name: 'solicitacoes_category_id_index'
    });

    await queryInterface.addIndex('solicitacoes', ['subcategory_id'], {
      name: 'solicitacoes_subcategory_id_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('solicitacoes', 'subcategory_id');
    await queryInterface.removeColumn('solicitacoes', 'category_id');
  }
};