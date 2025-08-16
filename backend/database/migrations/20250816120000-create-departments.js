'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('departments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nome: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      responsavel: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      localizacao: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Índices para melhor performance
    await queryInterface.addIndex('departments', ['nome'], {
      unique: true,
      name: 'departments_nome_unique'
    });

    await queryInterface.addIndex('departments', ['ativo'], {
      name: 'departments_ativo_index'
    });

    // Inserir alguns departamentos padrão
    await queryInterface.bulkInsert('departments', [
      {
        nome: 'Tecnologia da Informação',
        descricao: 'Departamento responsável pela infraestrutura de TI, sistemas e suporte técnico',
        responsavel: 'João Silva',
        localizacao: 'Andar 2 - Sala 201',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Manutenção',
        descricao: 'Departamento responsável pela manutenção predial e equipamentos',
        responsavel: 'Maria Santos',
        localizacao: 'Subsolo - Oficina',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Administração',
        descricao: 'Departamento administrativo e financeiro',
        responsavel: 'Carlos Oliveira',
        localizacao: 'Andar 1 - Sala 101',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Recursos Humanos',
        descricao: 'Departamento de gestão de pessoas e talentos',
        responsavel: 'Ana Costa',
        localizacao: 'Andar 1 - Sala 105',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('departments');
  }
};