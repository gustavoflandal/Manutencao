const { Model, DataTypes } = require('sequelize');

class AtivoImagem extends Model {
  static associate(models) {
    this.belongsTo(models.Ativo, {
      foreignKey: 'ativo_id',
      as: 'ativo'
    });
  }
}

module.exports = (sequelize) => {
  AtivoImagem.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ativo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ativos',
        key: 'id'
      }
    },
    nome_arquivo: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    caminho: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    tamanho: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    descricao: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    ordem: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 4 // Limita a 5 imagens (0-4)
      }
    }
  }, {
    sequelize,
    tableName: 'ativo_imagens',
    timestamps: true
  });

  return AtivoImagem;
};