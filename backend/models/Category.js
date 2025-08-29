const { Model, DataTypes } = require('sequelize');

class Category extends Model {
  static associate(models) {
    // Associações são definidas no index.js para evitar duplicação
  }
}

module.exports = (sequelize) => {
  Category.init({
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
          msg: 'Nome da categoria é obrigatório'
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
    cor: {
      type: DataTypes.STRING(7), // Para cores hexadecimais #FFFFFF
      allowNull: true,
      validate: {
        is: {
          args: /^#[0-9A-F]{6}$/i,
          msg: 'Cor deve estar no formato hexadecimal #FFFFFF'
        }
      }
    },
    icone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Nome do ícone deve ter no máximo 50 caracteres'
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
    tableName: 'categories',
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

  return Category;
};