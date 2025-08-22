const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrdemServico = sequelize.define('OrdemServico', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero_os: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    ativo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ativos',
        key: 'id'
      }
    },
    solicitacao_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'solicitacoes',
        key: 'id'
      }
    },
    solicitante_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tipo: {
      type: DataTypes.ENUM('corretiva', 'preventiva', 'preditiva', 'melhoria'),
      allowNull: false
    },
    descricao_servico: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('planejada', 'em_execucao', 'pausada', 'concluida', 'cancelada'),
      defaultValue: 'planejada'
    },
    prioridade: {
      type: DataTypes.ENUM('baixa', 'normal', 'alta', 'critica'),
      defaultValue: 'normal'
    },
    data_inicio_prevista: {
      type: DataTypes.DATE
    },
    data_inicio_real: {
      type: DataTypes.DATE
    },
    data_fim_prevista: {
      type: DataTypes.DATE
    },
    data_fim_real: {
      type: DataTypes.DATE
    },
    horas_planejadas: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0
    },
    horas_realizadas: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0
    },
    custo_mao_obra: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    custo_materiais: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    custo_terceiros: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    custo_total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    observacoes_execucao: {
      type: DataTypes.TEXT
    },
    avaliacao_servico: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5
      }
    },
    materiais_utilizados: {
      type: DataTypes.JSON,
      comment: 'Array de materiais utilizados na OS'
    },
    fotos_antes: {
      type: DataTypes.JSON,
      comment: 'Array de URLs das fotos antes do serviço'
    },
    fotos_depois: {
      type: DataTypes.JSON,
      comment: 'Array de URLs das fotos depois do serviço'
    },
    checklist: {
      type: DataTypes.JSON,
      comment: 'Checklist de atividades da OS'
    },
    fmea_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'fmea_analyses',
        key: 'id'
      },
      comment: 'Referência à análise FMEA que originou a OS'
    }
  }, {
    tableName: 'ordens_servico',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (os) => {
        const count = await OrdemServico.count();
        const year = new Date().getFullYear();
        os.numero_os = `OS-${year}-${String(count + 1).padStart(6, '0')}`;
      },
      beforeSave: (os) => {
        // Calcular custo total automaticamente
        os.custo_total = parseFloat(os.custo_mao_obra || 0) + 
                        parseFloat(os.custo_materiais || 0) + 
                        parseFloat(os.custo_terceiros || 0);
      }
    }
  });

  // Definir associações
  OrdemServico.associate = (models) => {
    OrdemServico.belongsTo(models.Ativo, {
      foreignKey: 'ativo_id',
      as: 'ativo'
    });

    OrdemServico.belongsTo(models.Solicitacao, {
      foreignKey: 'solicitacao_id',
      as: 'solicitacao'
    });

    OrdemServico.belongsTo(models.User, {
      foreignKey: 'solicitante_id',
      as: 'solicitante'
    });

    OrdemServico.belongsTo(models.User, {
      foreignKey: 'responsavel_id',
      as: 'responsavel'
    });

    OrdemServico.belongsTo(models.FmeaAnalysis, {
      foreignKey: 'fmea_id',
      as: 'fmea'
    });
  };

  return OrdemServico;
};