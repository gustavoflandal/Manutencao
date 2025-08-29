const { Model, DataTypes } = require('sequelize');

class OrdemServico extends Model {
  static associate(models) {
    this.belongsTo(models.Ativo, {
      foreignKey: 'ativo_id',
      as: 'ativo'
    });

    this.belongsTo(models.User, {
      foreignKey: 'solicitante_id',
      as: 'solicitante'
    });

    this.belongsTo(models.User, {
      foreignKey: 'responsavel_id',
      as: 'responsavel'
    });

    this.belongsTo(models.Solicitacao, {
      foreignKey: 'solicitacao_id',
      as: 'solicitacao'
    });

    this.belongsTo(models.FmeaAnalysis, {
      foreignKey: 'fmea_id',
      as: 'fmea'
    });
  }
}

module.exports = (sequelize) => {
  OrdemServico.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero_os: {
      type: DataTypes.STRING(20),
      unique: true
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
    fmea_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'fmea_analysis',
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
      type: DataTypes.ENUM('preventiva', 'corretiva', 'preditiva'),
      allowNull: false
    },
    descricao_servico: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('planejada', 'em_execucao', 'pausada', 'concluida', 'cancelada'),
      defaultValue: 'planejada'
    },
    prioridade: {
      type: DataTypes.ENUM('baixa', 'media', 'alta', 'urgente'),
      defaultValue: 'media'
    },
    data_inicio_prevista: {
      type: DataTypes.DATE,
      allowNull: false
    },
    data_inicio_real: {
      type: DataTypes.DATE,
      allowNull: true
    },
    data_fim_prevista: {
      type: DataTypes.DATE,
      allowNull: false
    },
    data_fim_real: {
      type: DataTypes.DATE,
      allowNull: true
    },
    horas_planejadas: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    horas_realizadas: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    custo_total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    observacoes_execucao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ordens_servico',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    hooks: {
      beforeCreate: async (ordem) => {
        // Gerar número da OS
        const year = new Date().getFullYear();
        const count = await OrdemServico.count({
          where: {
            created_at: {
              [sequelize.Op.gte]: new Date(year, 0, 1),
              [sequelize.Op.lt]: new Date(year + 1, 0, 1)
            }
          }
        });
        ordem.numero_os = `OS${year}${(count + 1).toString().padStart(4, '0')}`;
      }
    }
  });

  return OrdemServico;
};