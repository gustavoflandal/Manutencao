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
    tipo: {
      type: DataTypes.ENUM('corretiva', 'preventiva', 'preditiva', 'melhoria'),
      allowNull: false
    },
    descricao_servico: {
      type: DataTypes.TEXT
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
    }
  }, {
    tableName: 'ordens_servico',
    hooks: {
      beforeCreate: async (os) => {
        const count = await OrdemServico.count();
        os.numero_os = `OS${String(count + 1).padStart(6, '0')}`;
      },
      beforeSave: (os) => {
        // Calcular custo total automaticamente
        os.custo_total = parseFloat(os.custo_mao_obra || 0) + 
                        parseFloat(os.custo_materiais || 0) + 
                        parseFloat(os.custo_terceiros || 0);
      }
    }
  });

  return OrdemServico;
};