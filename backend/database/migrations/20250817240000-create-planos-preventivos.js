'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('planos_preventivos', {
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
        comment: 'Código único do plano preventivo (ex: PP001, PP002)'
      },
      nome: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Nome descritivo do plano de manutenção'
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Descrição detalhada das atividades de manutenção'
      },
      ativo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ativos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Ativo ao qual este plano se aplica'
      },
      setor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'setores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Setor responsável pela execução'
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
        comment: 'Usuário responsável pela execução do plano'
      },
      tipo_periodicidade: {
        type: Sequelize.ENUM('diaria', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'horas_funcionamento', 'contador_producao'),
        allowNull: false,
        comment: 'Tipo de periodicidade da manutenção'
      },
      intervalo_periodicidade: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Intervalo da periodicidade (ex: a cada 2 semanas = 2)'
      },
      horas_funcionamento_limite: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Limite de horas de funcionamento para trigger da manutenção'
      },
      contador_producao_limite: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Limite do contador de produção para trigger da manutenção'
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'normal', 'alta', 'critica'),
        allowNull: false,
        defaultValue: 'normal',
        comment: 'Prioridade da manutenção preventiva'
      },
      categoria: {
        type: Sequelize.ENUM('lubrificacao', 'inspecao', 'limpeza', 'calibracao', 'substituicao', 'ajuste', 'teste', 'outros'),
        allowNull: false,
        defaultValue: 'inspecao',
        comment: 'Categoria da manutenção preventiva'
      },
      duracao_estimada: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duração estimada em minutos'
      },
      custo_estimado: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
        comment: 'Custo estimado da manutenção'
      },
      procedimento: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Procedimento detalhado para execução'
      },
      ferramentas_necessarias: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Lista de ferramentas necessárias'
      },
      pecas_necessarias: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Lista de peças/materiais necessários'
      },
      data_inicio: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Data de início da vigência do plano'
      },
      data_fim: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Data de fim da vigência do plano (opcional)'
      },
      proxima_execucao: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Data da próxima execução programada'
      },
      ultima_execucao: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Data da última execução realizada'
      },
      executado_horas: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Horas de funcionamento na última execução'
      },
      executado_contador: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Contador de produção na última execução'
      },
      total_execucoes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total de execuções realizadas'
      },
      dias_antecedencia_alerta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 7,
        comment: 'Dias de antecedência para alerta'
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Se o plano está ativo'
      },
      observacoes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Observações gerais sobre o plano'
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

    // Índices para performance
    await queryInterface.addIndex('planos_preventivos', ['codigo'], {
      unique: true,
      name: 'idx_planos_preventivos_codigo'
    });

    await queryInterface.addIndex('planos_preventivos', ['ativo_id'], {
      name: 'idx_planos_preventivos_ativo_id'
    });

    await queryInterface.addIndex('planos_preventivos', ['setor_id'], {
      name: 'idx_planos_preventivos_setor_id'
    });

    await queryInterface.addIndex('planos_preventivos', ['responsavel_id'], {
      name: 'idx_planos_preventivos_responsavel_id'
    });

    await queryInterface.addIndex('planos_preventivos', ['proxima_execucao'], {
      name: 'idx_planos_preventivos_proxima_execucao'
    });

    await queryInterface.addIndex('planos_preventivos', ['ativo', 'proxima_execucao'], {
      name: 'idx_planos_preventivos_ativo_proxima'
    });

    await queryInterface.addIndex('planos_preventivos', ['tipo_periodicidade'], {
      name: 'idx_planos_preventivos_tipo_periodicidade'
    });

    await queryInterface.addIndex('planos_preventivos', ['categoria'], {
      name: 'idx_planos_preventivos_categoria'
    });

    await queryInterface.addIndex('planos_preventivos', ['prioridade'], {
      name: 'idx_planos_preventivos_prioridade'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('planos_preventivos');
  }
};