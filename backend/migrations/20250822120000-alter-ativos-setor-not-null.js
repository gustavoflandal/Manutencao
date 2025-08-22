'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Garantir que não existam nulls (por segurança extra)
    await queryInterface.sequelize.query(`UPDATE ativos SET setor_id = (
      SELECT id FROM setores WHERE codigo = 'DEFAULT' LIMIT 1
    ) WHERE setor_id IS NULL`);

    await queryInterface.changeColumn('ativos', 'setor_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'setores',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('ativos', 'setor_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'setores',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};
