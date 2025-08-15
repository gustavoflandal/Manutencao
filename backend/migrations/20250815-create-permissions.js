const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Criar tabela de permissões
    await queryInterface.createTable('permissions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      resource: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Criar tabela de relacionamento usuário-permissão
    await queryInterface.createTable('user_permissions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      granted_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      granted_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Criar índices
    await queryInterface.addIndex('permissions', ['module', 'action', 'resource'], {
      unique: true,
      name: 'permissions_unique_module_action_resource'
    });

    await queryInterface.addIndex('user_permissions', ['user_id', 'permission_id'], {
      unique: true,
      name: 'user_permissions_unique_user_permission'
    });

    // Inserir permissões básicas do sistema
    await queryInterface.bulkInsert('permissions', [
      // Módulo de Usuários
      {
        name: 'users.view',
        description: 'Visualizar lista de usuários',
        module: 'users',
        action: 'view',
        resource: null,
        active: true
      },
      {
        name: 'users.create',
        description: 'Criar novos usuários',
        module: 'users',
        action: 'create',
        resource: null,
        active: true
      },
      {
        name: 'users.edit',
        description: 'Editar dados de usuários',
        module: 'users',
        action: 'edit',
        resource: null,
        active: true
      },
      {
        name: 'users.delete',
        description: 'Desativar usuários',
        module: 'users',
        action: 'delete',
        resource: null,
        active: true
      },
      {
        name: 'users.permissions',
        description: 'Gerenciar permissões de usuários',
        module: 'users',
        action: 'manage',
        resource: 'permissions',
        active: true
      },

      // Módulo de Manutenção
      {
        name: 'maintenance.view',
        description: 'Visualizar solicitações de manutenção',
        module: 'maintenance',
        action: 'view',
        resource: null,
        active: true
      },
      {
        name: 'maintenance.create',
        description: 'Criar solicitações de manutenção',
        module: 'maintenance',
        action: 'create',
        resource: null,
        active: true
      },
      {
        name: 'maintenance.edit',
        description: 'Editar solicitações de manutenção',
        module: 'maintenance',
        action: 'edit',
        resource: null,
        active: true
      },
      {
        name: 'maintenance.approve',
        description: 'Aprovar solicitações de manutenção',
        module: 'maintenance',
        action: 'approve',
        resource: null,
        active: true
      },
      {
        name: 'maintenance.execute',
        description: 'Executar ordens de serviço',
        module: 'maintenance',
        action: 'execute',
        resource: null,
        active: true
      },

      // Módulo de Relatórios
      {
        name: 'reports.view',
        description: 'Visualizar relatórios básicos',
        module: 'reports',
        action: 'view',
        resource: null,
        active: true
      },
      {
        name: 'reports.advanced',
        description: 'Acessar relatórios avançados',
        module: 'reports',
        action: 'view',
        resource: 'advanced',
        active: true
      },
      {
        name: 'reports.export',
        description: 'Exportar relatórios',
        module: 'reports',
        action: 'export',
        resource: null,
        active: true
      },

      // Módulo de Configurações
      {
        name: 'settings.view',
        description: 'Visualizar configurações do sistema',
        module: 'settings',
        action: 'view',
        resource: null,
        active: true
      },
      {
        name: 'settings.edit',
        description: 'Editar configurações do sistema',
        module: 'settings',
        action: 'edit',
        resource: null,
        active: true
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_permissions');
    await queryInterface.dropTable('permissions');
  }
};
