const { Model, DataTypes } = require('sequelize');

class Setor extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'responsavel_id',
      as: 'responsavel'
    });

    this.hasMany(models.Ativo, {
      foreignKey: 'setor_id',
      as: 'ativos'
    });
  }

  // Método para buscar setores ativos
  static async buscarAtivos(options = {}) {
    return this.findAll({
      where: { deleted_at: null },
      order: [['nome', 'ASC']],
      ...options
    });
  }

  // Método para calcular estatísticas dos ativos do setor
  getStatusAtivos() {
    if (!this.ativos || this.ativos.length === 0) {
      return {
        total: 0,
        operacional: 0,
        manutencao: 0,
        parado: 0,
        inativo: 0,
        criticos: 0
      };
    }

    const stats = {
      total: this.ativos.length,
      operacional: 0,
      manutencao: 0,
      parado: 0,
      inativo: 0,
      criticos: 0
    };

    this.ativos.forEach(ativo => {
      if (ativo.estado === 'operacional') stats.operacional++;
      else if (ativo.estado === 'manutencao') stats.manutencao++;
      else if (ativo.estado === 'parado') stats.parado++;
      else if (ativo.estado === 'inativo') stats.inativo++;
      
      if (ativo.criticidade === 'critica') stats.criticos++;
    });

    return stats;
  }
}

module.exports = (sequelize) => {
  Setor.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'setores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  return Setor;
};