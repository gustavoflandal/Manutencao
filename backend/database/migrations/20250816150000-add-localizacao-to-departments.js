'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('departments', 'localizacao', {
      type: Sequelize.STRING(200),
      allowNull: true,
      after: 'responsavel' // Adiciona após o campo responsavel
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('departments', 'localizacao');
  }
};