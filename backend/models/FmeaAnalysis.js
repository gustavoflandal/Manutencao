const { Model, DataTypes } = require('sequelize');

class FmeaAnalysis extends Model {
  static associate(models) {
    this.belongsTo(models.Ativo, {
      foreignKey: 'equipment_id',
      as: 'equipment'
    });

    this.belongsTo(models.User, {
      foreignKey: 'analyst_id',
      as: 'analyst'
    });

    this.hasMany(models.FmeaAction, {
      foreignKey: 'fmea_id',
      as: 'actions'
    });

    this.hasMany(models.OrdemServico, {
      foreignKey: 'fmea_id',
      as: 'ordens_servico'
    });
  }
}

module.exports = (sequelize) => {
  FmeaAnalysis.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ativos',
        key: 'id'
      }
    },
    analyst_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    component: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    function: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    failure_mode: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    failure_effect: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    failure_cause: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    current_controls: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    severity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10
      }
    },
    occurrence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10
      }
    },
    detection: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10
      }
    },
    rpn: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'review', 'approved', 'archived'),
      defaultValue: 'draft'
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'fmea_analysis',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  return FmeaAnalysis;
};