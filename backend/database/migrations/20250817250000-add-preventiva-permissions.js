const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Inserir novas permissões para planos preventivos
    await queryInterface.bulkInsert('permissions', [
      {
        name: 'planos_preventivos.read',
        description: 'Visualizar planos de manutenção preventiva',
        module: 'planos_preventivos',
        action: 'read',
        resource: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'planos_preventivos.create',
        description: 'Criar novos planos de manutenção preventiva',
        module: 'planos_preventivos',
        action: 'create',
        resource: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'planos_preventivos.update',
        description: 'Editar e executar planos de manutenção preventiva',
        module: 'planos_preventivos',
        action: 'update',
        resource: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'planos_preventivos.delete',
        description: 'Excluir planos de manutenção preventiva',
        module: 'planos_preventivos',
        action: 'delete',
        resource: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'planos_preventivos.stats',
        description: 'Visualizar estatísticas de manutenção preventiva',
        module: 'planos_preventivos',
        action: 'read',
        resource: 'stats',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'planos_preventivos.calendario',
        description: 'Visualizar calendário de manutenção preventiva',
        module: 'planos_preventivos',
        action: 'read',
        resource: 'calendario',
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remover permissões de planos preventivos
    await queryInterface.bulkDelete('permissions', {
      module: 'planos_preventivos'
    });
  }
};