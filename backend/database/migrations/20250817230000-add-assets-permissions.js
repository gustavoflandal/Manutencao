'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Inserir permissões para o módulo de Ativos
    await queryInterface.bulkInsert('permissions', [
      {
        name: 'assets.view',
        description: 'Visualizar ativos',
        module: 'assets',
        action: 'view',
        resource: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'assets.create',
        description: 'Criar ativos',
        module: 'assets',
        action: 'create',
        resource: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'assets.edit',
        description: 'Editar ativos',
        module: 'assets',
        action: 'edit',
        resource: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'assets.delete',
        description: 'Excluir ativos',
        module: 'assets',
        action: 'delete',
        resource: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'assets.maintenance',
        description: 'Realizar manutenção em ativos',
        module: 'assets',
        action: 'maintenance',
        resource: null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log('✅ Permissões de ativos inseridas com sucesso!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('permissions', {
      module: 'assets'
    });
  }
};