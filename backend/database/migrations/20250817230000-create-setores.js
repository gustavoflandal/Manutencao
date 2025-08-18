'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('setores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      codigo: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Código único do setor (ex: PROD, MANUT, ADM)'
      },
      nome: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Nome do setor'
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Descrição detalhada do setor'
      },
      localizacao: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Localização física do setor'
      },
      responsavel_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Responsável pelo setor'
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Se o setor está ativo'
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
    }, {
      comment: 'Tabela de setores/departamentos da empresa'
    });

    // Índices para otimização
    await queryInterface.addIndex('setores', ['codigo'], {
      unique: true,
      name: 'idx_setores_codigo'
    });

    await queryInterface.addIndex('setores', ['ativo'], {
      name: 'idx_setores_ativo'
    });

    await queryInterface.addIndex('setores', ['responsavel_id'], {
      name: 'idx_setores_responsavel'
    });

    // Inserir setores padrão
    await queryInterface.bulkInsert('setores', [
      {
        codigo: 'PROD',
        nome: 'Produção',
        descricao: 'Setor responsável pela produção e manufatura',
        localizacao: 'Pavilhão A',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        codigo: 'MANUT',
        nome: 'Manutenção',
        descricao: 'Setor responsável pela manutenção de equipamentos',
        localizacao: 'Oficina Central',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        codigo: 'QUAL',
        nome: 'Qualidade',
        descricao: 'Setor de controle e garantia da qualidade',
        localizacao: 'Laboratório',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        codigo: 'ADM',
        nome: 'Administrativo',
        descricao: 'Setor administrativo e financeiro',
        localizacao: 'Escritório Central',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        codigo: 'EST',
        nome: 'Estoque',
        descricao: 'Setor de almoxarifado e estoque',
        localizacao: 'Depósito',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('setores');
  }
};