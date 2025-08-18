'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ativos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      codigo_patrimonio: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
        comment: 'Código patrimonial único do ativo'
      },
      nome: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Nome/descrição do ativo'
      },
      fabricante: {
        type: Sequelize.STRING(100),
        comment: 'Fabricante do equipamento'
      },
      modelo: {
        type: Sequelize.STRING(100),
        comment: 'Modelo do equipamento'
      },
      numero_serie: {
        type: Sequelize.STRING(100),
        comment: 'Número de série'
      },
      ano_fabricacao: {
        type: Sequelize.INTEGER,
        comment: 'Ano de fabricação'
      },
      data_aquisicao: {
        type: Sequelize.DATE,
        comment: 'Data de aquisição do ativo'
      },
      valor_aquisicao: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        comment: 'Valor de aquisição'
      },
      valor_atual: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        comment: 'Valor atual (depreciado)'
      },
      categoria_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Categoria do ativo'
      },
      subcategoria_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'subcategories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Subcategoria do ativo'
      },
      department_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Departamento responsável pelo ativo'
      },
      localizacao_completa: {
        type: Sequelize.STRING(500),
        comment: 'Localização hierárquica completa (Prédio > Andar > Sala > Posição)'
      },
      predio: {
        type: Sequelize.STRING(100),
        comment: 'Prédio onde está localizado'
      },
      andar: {
        type: Sequelize.STRING(50),
        comment: 'Andar/pavimento'
      },
      sala: {
        type: Sequelize.STRING(100),
        comment: 'Sala/ambiente'
      },
      posicao: {
        type: Sequelize.STRING(100),
        comment: 'Posição específica'
      },
      estado: {
        type: Sequelize.ENUM('operacional', 'manutencao', 'parado', 'inativo', 'baixado'),
        defaultValue: 'operacional',
        comment: 'Estado atual do ativo'
      },
      criticidade: {
        type: Sequelize.ENUM('baixa', 'media', 'alta', 'critica'),
        defaultValue: 'media',
        comment: 'Criticidade do ativo para o processo'
      },
      potencia: {
        type: Sequelize.STRING(50),
        comment: 'Potência do equipamento'
      },
      tensao: {
        type: Sequelize.STRING(50),
        comment: 'Tensão de operação'
      },
      frequencia: {
        type: Sequelize.STRING(50),
        comment: 'Frequência de operação'
      },
      peso: {
        type: Sequelize.DECIMAL(10, 2),
        comment: 'Peso em kg'
      },
      dimensoes: {
        type: Sequelize.STRING(200),
        comment: 'Dimensões (LxAxP em metros)'
      },
      capacidade: {
        type: Sequelize.STRING(100),
        comment: 'Capacidade de produção/operação'
      },
      fornecedor: {
        type: Sequelize.STRING(200),
        comment: 'Fornecedor principal'
      },
      garantia_ate: {
        type: Sequelize.DATE,
        comment: 'Data de vencimento da garantia'
      },
      manual_operacao: {
        type: Sequelize.TEXT,
        comment: 'Link ou referência para manual de operação'
      },
      manual_manutencao: {
        type: Sequelize.TEXT,
        comment: 'Link ou referência para manual de manutenção'
      },
      especificacoes_tecnicas: {
        type: Sequelize.TEXT,
        comment: 'Especificações técnicas detalhadas'
      },
      observacoes: {
        type: Sequelize.TEXT,
        comment: 'Observações gerais'
      },
      qr_code: {
        type: Sequelize.STRING(500),
        comment: 'QR Code gerado para identificação rápida'
      },
      foto_principal: {
        type: Sequelize.STRING(500),
        comment: 'URL da foto principal do ativo'
      },
      responsavel_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Responsável principal pelo ativo'
      },
      data_proxima_inspecao: {
        type: Sequelize.DATE,
        comment: 'Data da próxima inspeção programada'
      },
      horas_funcionamento: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00,
        comment: 'Total de horas de funcionamento'
      },
      contador_producao: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Contador de produção (peças, ciclos, etc.)'
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Ativo habilitado no sistema'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    }, {
      comment: 'Tabela de ativos/equipamentos do sistema de manutenção'
    });

    // Índices para performance
    await queryInterface.addIndex('ativos', ['codigo_patrimonio'], {
      name: 'idx_ativos_codigo_patrimonio',
      unique: true
    });

    await queryInterface.addIndex('ativos', ['estado'], {
      name: 'idx_ativos_estado'
    });

    await queryInterface.addIndex('ativos', ['criticidade'], {
      name: 'idx_ativos_criticidade'
    });

    await queryInterface.addIndex('ativos', ['categoria_id'], {
      name: 'idx_ativos_categoria'
    });

    await queryInterface.addIndex('ativos', ['department_id'], {
      name: 'idx_ativos_department'
    });

    await queryInterface.addIndex('ativos', ['ativo'], {
      name: 'idx_ativos_ativo'
    });

    await queryInterface.addIndex('ativos', ['data_proxima_inspecao'], {
      name: 'idx_ativos_proxima_inspecao'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ativos');
  }
};