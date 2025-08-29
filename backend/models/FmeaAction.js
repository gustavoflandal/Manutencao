const { Model, DataTypes } = require('sequelize');

class FmeaAction extends Model {
  static associate(models) {
    this.belongsTo(models.FmeaAnalysis, {
      foreignKey: 'fmea_id',
      as: 'analysis'
    });

    this.belongsTo(models.User, {
      foreignKey: 'responsible_id',
      as: 'responsible'
    });
  }
}

module.exports = (sequelize) => {
  FmeaAction.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fmea_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'fmea_analysis',
        key: 'id'
      }
    },
    responsible_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Descrição da ação recomendada'
    },
    type: {
      type: DataTypes.ENUM('preventive', 'corrective', 'detective'),
      allowNull: false,
      defaultValue: 'preventive',
      comment: 'Tipo de ação'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Prioridade da ação'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Status da ação'
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data limite para conclusão'
    },
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de conclusão'
    },
    completion_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observações sobre a conclusão'
    },
    effectiveness: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10
      },
      comment: 'Eficácia da ação (1-10)'
    }
  }, {
    sequelize,
    tableName: 'fmea_actions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return FmeaAction;
};