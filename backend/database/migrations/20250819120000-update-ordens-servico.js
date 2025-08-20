'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar se a tabela existe
    const tableExists = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'ordens_servico'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists[0].count === 0) {
      // Criar tabela se não existir
      await queryInterface.createTable('ordens_servico', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        numero_os: {
          type: Sequelize.STRING(20),
          unique: true,
          allowNull: false
        },
        ativo_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'ativos',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        solicitacao_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'solicitacoes',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        solicitante_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        responsavel_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        tipo: {
          type: Sequelize.ENUM('corretiva', 'preventiva', 'preditiva', 'melhoria'),
          allowNull: false
        },
        descricao_servico: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('planejada', 'em_execucao', 'pausada', 'concluida', 'cancelada'),
          defaultValue: 'planejada'
        },
        prioridade: {
          type: Sequelize.ENUM('baixa', 'normal', 'alta', 'critica'),
          defaultValue: 'normal'
        },
        data_inicio_prevista: {
          type: Sequelize.DATE,
          allowNull: true
        },
        data_inicio_real: {
          type: Sequelize.DATE,
          allowNull: true
        },
        data_fim_prevista: {
          type: Sequelize.DATE,
          allowNull: true
        },
        data_fim_real: {
          type: Sequelize.DATE,
          allowNull: true
        },
        horas_planejadas: {
          type: Sequelize.DECIMAL(8, 2),
          defaultValue: 0
        },
        horas_realizadas: {
          type: Sequelize.DECIMAL(8, 2),
          defaultValue: 0
        },
        custo_mao_obra: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        custo_materiais: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        custo_terceiros: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        custo_total: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        observacoes_execucao: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        avaliacao_servico: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 5
          }
        },
        materiais_utilizados: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array de materiais utilizados na OS'
        },
        fotos_antes: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array de URLs das fotos antes do serviço'
        },
        fotos_depois: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array de URLs das fotos depois do serviço'
        },
        checklist: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Checklist de atividades da OS'
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
    } else {
      // Verificar e adicionar colunas que podem estar faltando
      const columns = await queryInterface.describeTable('ordens_servico');
      
      const columnsToAdd = [];
      
      if (!columns.ativo_id) {
        columnsToAdd.push(['ativo_id', {
          type: Sequelize.INTEGER,
          allowNull: true, // Temporariamente true para não quebrar dados existentes
          references: {
            model: 'ativos',
            key: 'id'
          }
        }]);
      }
      
      if (!columns.solicitacao_id) {
        columnsToAdd.push(['solicitacao_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'solicitacoes',
            key: 'id'
          }
        }]);
      }
      
      if (!columns.solicitante_id) {
        columnsToAdd.push(['solicitante_id', {
          type: Sequelize.INTEGER,
          allowNull: true, // Temporariamente true
          references: {
            model: 'users',
            key: 'id'
          }
        }]);
      }
      
      if (!columns.responsavel_id) {
        columnsToAdd.push(['responsavel_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        }]);
      }

      if (!columns.materiais_utilizados) {
        columnsToAdd.push(['materiais_utilizados', {
          type: Sequelize.JSON,
          allowNull: true
        }]);
      }

      if (!columns.fotos_antes) {
        columnsToAdd.push(['fotos_antes', {
          type: Sequelize.JSON,
          allowNull: true
        }]);
      }

      if (!columns.fotos_depois) {
        columnsToAdd.push(['fotos_depois', {
          type: Sequelize.JSON,
          allowNull: true
        }]);
      }

      if (!columns.checklist) {
        columnsToAdd.push(['checklist', {
          type: Sequelize.JSON,
          allowNull: true
        }]);
      }

      // Adicionar colunas faltantes
      for (const [columnName, columnDefinition] of columnsToAdd) {
        await queryInterface.addColumn('ordens_servico', columnName, columnDefinition);
      }

      // Atualizar descrição_servico para ser obrigatória se não for
      if (columns.descricao_servico && columns.descricao_servico.allowNull !== false) {
        await queryInterface.changeColumn('ordens_servico', 'descricao_servico', {
          type: Sequelize.TEXT,
          allowNull: true // Mantemos true para não quebrar dados existentes
        });
      }
    }

    // Criar índices para melhor performance
    try {
      await queryInterface.addIndex('ordens_servico', ['status', 'prioridade'], {
        name: 'idx_os_status_prioridade'
      });
    } catch (error) {
      // Índice pode já existir
    }

    try {
      await queryInterface.addIndex('ordens_servico', ['ativo_id'], {
        name: 'idx_os_ativo_id'
      });
    } catch (error) {
      // Índice pode já existir
    }

    try {
      await queryInterface.addIndex('ordens_servico', ['responsavel_id'], {
        name: 'idx_os_responsavel_id'
      });
    } catch (error) {
      // Índice pode já existir
    }

    try {
      await queryInterface.addIndex('ordens_servico', ['data_inicio_prevista'], {
        name: 'idx_os_data_inicio_prevista'
      });
    } catch (error) {
      // Índice pode já existir
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remover índices
    try {
      await queryInterface.removeIndex('ordens_servico', 'idx_os_status_prioridade');
    } catch (error) {
      // Índice pode não existir
    }

    try {
      await queryInterface.removeIndex('ordens_servico', 'idx_os_ativo_id');
    } catch (error) {
      // Índice pode não existir
    }

    try {
      await queryInterface.removeIndex('ordens_servico', 'idx_os_responsavel_id');
    } catch (error) {
      // Índice pode não existir
    }

    try {
      await queryInterface.removeIndex('ordens_servico', 'idx_os_data_inicio_prevista');
    } catch (error) {
      // Índice pode não existir
    }

    // Remover colunas adicionadas
    const columns = await queryInterface.describeTable('ordens_servico');
    
    if (columns.materiais_utilizados) {
      await queryInterface.removeColumn('ordens_servico', 'materiais_utilizados');
    }
    
    if (columns.fotos_antes) {
      await queryInterface.removeColumn('ordens_servico', 'fotos_antes');
    }
    
    if (columns.fotos_depois) {
      await queryInterface.removeColumn('ordens_servico', 'fotos_depois');
    }
    
    if (columns.checklist) {
      await queryInterface.removeColumn('ordens_servico', 'checklist');
    }
  }
};