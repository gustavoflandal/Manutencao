const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FmeaAction extends Model {
  static associate(models) {
    FmeaAction.belongsTo(models.FmeaAnalysis, {
      foreignKey: 'fmea_id',
      as: 'analysis'
    });
    
    FmeaAction.belongsTo(models.User, {
      foreignKey: 'completed_by',
      as: 'completedByUser'
    });
  }
}

FmeaAction.init({
  fmea_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'FMEA é obrigatório' }
    }
  },
  action_taken: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Ação tomada é obrigatória' }
    }
  },
  new_severity: {
    type: DataTypes.INTEGER,
    validate: {
      min: { args: 1, msg: 'Severidade deve ser entre 1 e 10' },
      max: { args: 10, msg: 'Severidade deve ser entre 1 e 10' }
    }
  },
  new_occurrence: {
    type: DataTypes.INTEGER,
    validate: {
      min: { args: 1, msg: 'Ocorrência deve ser entre 1 e 10' },
      max: { args: 10, msg: 'Ocorrência deve ser entre 1 e 10' }
    }
  },
  new_detection: {
    type: DataTypes.INTEGER,
    validate: {
      min: { args: 1, msg: 'Detecção deve ser entre 1 e 10' },
      max: { args: 10, msg: 'Detecção deve ser entre 1 e 10' }
    }
  },
  new_rpn: {
    type: DataTypes.INTEGER
  },
  completed_date: DataTypes.DATE,
  completed_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'FmeaAction',
  tableName: 'fmea_actions',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (action) => {
      // Calcula o novo RPN após a ação
      if (action.new_severity && action.new_occurrence && action.new_detection) {
        action.new_rpn = action.new_severity * action.new_occurrence * action.new_detection;
      }
    }
  }
});

module.exports = FmeaAction;