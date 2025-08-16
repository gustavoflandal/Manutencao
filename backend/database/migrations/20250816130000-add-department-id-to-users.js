'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Adicionar coluna department_id
    await queryInterface.addColumn('users', 'department_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Criar índice para melhor performance
    await queryInterface.addIndex('users', ['department_id'], {
      name: 'idx_users_department_id'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remover índice
    await queryInterface.removeIndex('users', 'idx_users_department_id');
    
    // Remover coluna
    await queryInterface.removeColumn('users', 'department_id');
  }
};