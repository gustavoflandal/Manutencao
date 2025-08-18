'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Inserir permissões do módulo de estoque
    const estoquePermissions = [
      {
        name: 'estoque.visualizar',
        description: 'Visualizar informações de estoque',
        module: 'estoque',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'estoque.criar',
        description: 'Criar itens, categorias e fornecedores',
        module: 'estoque',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'estoque.editar',
        description: 'Editar itens, categorias e fornecedores',
        module: 'estoque',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'estoque.excluir',
        description: 'Excluir itens, categorias e fornecedores',
        module: 'estoque',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'estoque.movimentar',
        description: 'Criar movimentações de entrada e saída',
        module: 'estoque',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'estoque.relatorios',
        description: 'Acessar relatórios de estoque',
        module: 'estoque',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('permissions', estoquePermissions);

    // Obter o ID do usuário admin (primeiro usuário)
    const [admin] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = "admin@sistema.com" LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (admin) {
      // Obter IDs das permissões inseridas
      const insertedPermissions = await queryInterface.sequelize.query(
        'SELECT id FROM permissions WHERE module = "estoque"',
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Atribuir todas as permissões de estoque ao admin
      const userPermissions = insertedPermissions.map(permission => ({
        user_id: admin.id,
        permission_id: permission.id,
        granted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await queryInterface.bulkInsert('user_permissions', userPermissions);
    }

    console.log('✅ Permissões do módulo de estoque criadas com sucesso!');
  },

  async down(queryInterface, Sequelize) {
    // Remover permissões do usuário
    await queryInterface.sequelize.query(
      'DELETE FROM user_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE module = "estoque")'
    );

    // Remover permissões
    await queryInterface.bulkDelete('permissions', {
      module: 'estoque'
    });

    console.log('✅ Permissões do módulo de estoque removidas com sucesso!');
  }
};