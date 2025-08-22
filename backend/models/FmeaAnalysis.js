const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FmeaAnalysis extends Model {
  static associate(models) {
    // Associações
    FmeaAnalysis.belongsTo(models.Ativo, {
      foreignKey: 'equipment_id',
      as: 'equipment'
    });
    
    FmeaAnalysis.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    
    FmeaAnalysis.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updater'
    });
    
    FmeaAnalysis.belongsTo(models.User, {
      foreignKey: 'responsible',
      as: 'responsibleUser'
    });
    
    FmeaAnalysis.hasMany(models.FmeaAction, {
      foreignKey: 'fmea_id',
      as: 'actions'
    });

    // Associação com OrdemServico
    FmeaAnalysis.hasMany(models.OrdemServico, {
      foreignKey: 'fmea_id',
      as: 'ordens_servico'
    });
  }
}

FmeaAnalysis.init({
  equipment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'Equipamento é obrigatório' }
    }
  },
  component: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Componente é obrigatório' }
    }
  },
  function: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Função é obrigatória' }
    }
  },
  failure_mode: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Modo de falha é obrigatório' }
    }
  },
  failure_effect: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Efeito da falha é obrigatório' }
    }
  },
  failure_cause: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Causa da falha é obrigatória' }
    }
  },
  current_controls: DataTypes.TEXT,
  severity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: 1, msg: 'Severidade deve ser entre 1 e 10' },
      max: { args: 10, msg: 'Severidade deve ser entre 1 e 10' }
    }
  },
  occurrence: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: 1, msg: 'Ocorrência deve ser entre 1 e 10' },
      max: { args: 10, msg: 'Ocorrência deve ser entre 1 e 10' }
    }
  },
  detection: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: 1, msg: 'Detecção deve ser entre 1 e 10' },
      max: { args: 10, msg: 'Detecção deve ser entre 1 e 10' }
    }
  },
  rpn: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recommended_actions: DataTypes.TEXT,
  responsible: DataTypes.INTEGER,
  target_date: DataTypes.DATE,
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'open'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  updated_by: DataTypes.INTEGER
}, {
  sequelize,
  modelName: 'FmeaAnalysis',
  tableName: 'fmea_analyses',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (fmea) => {
      // Calcula o RPN (Risk Priority Number)
      if (fmea.severity && fmea.occurrence && fmea.detection) {
        fmea.rpn = fmea.severity * fmea.occurrence * fmea.detection;
      }
    }
  }
});

module.exports = FmeaAnalysis;