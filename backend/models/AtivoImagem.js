const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AtivoImagem = sequelize.define('AtivoImagem', {
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
        max: 3 // Limita a 4 imagens (0-3)
      }
    }
  }, {
    tableName: 'ativo_imagens',
    timestamps: true
  });

  // Associação com Ativo
  AtivoImagem.associate = (models) => {
    AtivoImagem.belongsTo(models.Ativo, {
      foreignKey: 'ativo_id',
      as: 'ativo'
    });
  };

  return AtivoImagem;
};