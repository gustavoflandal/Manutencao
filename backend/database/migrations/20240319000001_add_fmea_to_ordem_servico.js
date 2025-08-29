'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ordens_servico', 'fmea_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'fmea_analyses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('ordens_servico', ['fmea_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ordens_servico', 'fmea_id');
  }
};
