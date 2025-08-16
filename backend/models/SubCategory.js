const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubCategory = sequelize.define('SubCategory', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome da subcategoria é obrigatório'
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'Categoria é obrigatória'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'subcategories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['nome', 'category_id'] // Nome único por categoria
      },
      {
        fields: ['category_id']
      },
      {
        fields: ['ativo']
      }
    ]
  });

  SubCategory.associate = (models) => {
    // Associações são definidas no index.js para evitar duplicação
  };

  return SubCategory;
};