'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar coluna ativo_id
    await queryInterface.addColumn('solicitacoes', 'ativo_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ativos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Adicionar índice para ativo_id
    await queryInterface.addIndex('solicitacoes', ['ativo_id'], {
      name: 'idx_solicitacoes_ativo_id'
    });

    // Adicionar coluna category_id para substituir categoria enum
    await queryInterface.addColumn('solicitacoes', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Adicionar coluna subcategory_id para substituir subcategoria string
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

    // Adicionar índices
    await queryInterface.addIndex('solicitacoes', ['category_id'], {
      name: 'idx_solicitacoes_category_id'
    });

    await queryInterface.addIndex('solicitacoes', ['subcategory_id'], {
      name: 'idx_solicitacoes_subcategory_id'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover índices
    await queryInterface.removeIndex('solicitacoes', 'idx_solicitacoes_ativo_id');
    await queryInterface.removeIndex('solicitacoes', 'idx_solicitacoes_category_id');
    await queryInterface.removeIndex('solicitacoes', 'idx_solicitacoes_subcategory_id');
    
    // Remover colunas
    await queryInterface.removeColumn('solicitacoes', 'ativo_id');
    await queryInterface.removeColumn('solicitacoes', 'category_id');
    await queryInterface.removeColumn('solicitacoes', 'subcategory_id');
  }
};