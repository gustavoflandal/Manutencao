'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar coluna setor_id à tabela ativos
    await queryInterface.addColumn('ativos', 'setor_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'setores',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Setor ao qual o ativo pertence'
    });

    // Criar índice para otimização
    await queryInterface.addIndex('ativos', ['setor_id'], {
      name: 'idx_ativos_setor_id'
    });

    // Atualizar ativos existentes com setor padrão (Produção)
    await queryInterface.sequelize.query(`
      UPDATE ativos 
      SET setor_id = (SELECT id FROM setores WHERE codigo = 'PROD' LIMIT 1) 
      WHERE setor_id IS NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remover índice
    await queryInterface.removeIndex('ativos', 'idx_ativos_setor_id');
    
    // Remover coluna
    await queryInterface.removeColumn('ativos', 'setor_id');
  }
};