const { Model, DataTypes } = require('sequelize');

class Department extends Model {
  static associate(models) {
    this.hasMany(models.User, {
      foreignKey: 'department_id',
      as: 'usuarios'
    });
  }
}

module.exports = (sequelize) => {
  Department.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Nome do departamento é obrigatório'
        },
        len: {
          args: [2, 100],
          msg: 'Nome deve ter entre 2 e 100 caracteres'
        }
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Descrição deve ter no máximo 500 caracteres'
        }
      }
    },
    responsavel: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Nome do responsável deve ter no máximo 100 caracteres'
        }
      }
    },
    localizacao: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        len: {
          args: [0, 200],
          msg: 'Localização deve ter no máximo 200 caracteres'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'departments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['nome']
      },
      {
        fields: ['ativo']
      }
    ]
  });

  return Department;
};