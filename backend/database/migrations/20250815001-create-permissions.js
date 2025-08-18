'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Criar tabela de permissões
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Criar tabela de relacionamento usuário-permissão
    await queryInterface.createTable('user_permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      granted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Criar índices
    await queryInterface.addIndex('user_permissions', ['user_id', 'permission_id'], {
      unique: true,
      name: 'user_permissions_unique'
    });

    // Inserir permissões básicas do sistema
    await queryInterface.bulkInsert('permissions', [
      // Módulo de Usuários
      {
        name: 'users.view',
        description: 'Visualizar lista de usuários',
        module: 'users',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'users.create',
        description: 'Criar novos usuários',
        module: 'users',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'users.edit',
        description: 'Editar dados de usuários',
        module: 'users',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'users.delete',
        description: 'Desativar usuários',
        module: 'users',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'users.permissions',
        description: 'Gerenciar permissões de usuários',
        module: 'users',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Módulo de Manutenção
      {
        name: 'maintenance.view',
        description: 'Visualizar solicitações de manutenção',
        module: 'maintenance',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'maintenance.create',
        description: 'Criar solicitações de manutenção',
        module: 'maintenance',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'maintenance.edit',
        description: 'Editar solicitações de manutenção',
        module: 'maintenance',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'maintenance.approve',
        description: 'Aprovar solicitações de manutenção',
        module: 'maintenance',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Módulo de Relatórios
      {
        name: 'reports.view',
        description: 'Visualizar relatórios básicos',
        module: 'reports',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'reports.export',
        description: 'Exportar relatórios',
        module: 'reports',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_permissions');
    await queryInterface.dropTable('permissions');
  }
};