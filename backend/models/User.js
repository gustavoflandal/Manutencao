const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

class User extends Model {
  static associate(models) {
    this.belongsToMany(models.Permission, {
      through: models.UserPermission,
      foreignKey: 'user_id',
      otherKey: 'permission_id',
      as: 'permissions'
    });

    this.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department'
    });

    this.hasMany(models.Solicitacao, {
      foreignKey: 'solicitante_id',
      as: 'solicitacoes'
    });

    this.hasMany(models.OrdemServico, {
      foreignKey: 'solicitante_id',
      as: 'ordens_servico_solicitadas'
    });

    this.hasMany(models.OrdemServico, {
      foreignKey: 'responsavel_id',
      as: 'ordens_servico_responsavel'
    });

    this.hasMany(models.FmeaAnalysis, {
      foreignKey: 'analyst_id',
      as: 'fmea_analyses'
    });

    this.hasMany(models.FmeaAction, {
      foreignKey: 'responsible_id',
      as: 'fmea_actions'
    });
  }

  async validatePassword(senha) {
    return bcrypt.compare(senha, this.senha);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.senha;
    return values;
  }
}

module.exports = (sequelize) => {
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    perfil: {
      type: DataTypes.ENUM('solicitante', 'tecnico', 'supervisor', 'administrador'),
      allowNull: false,
      defaultValue: 'solicitante'
    },
    departamento: {
      type: DataTypes.STRING(100)
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    telefone: {
      type: DataTypes.STRING(20)
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ultimo_login: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        user.senha = await bcrypt.hash(user.senha, 12);
      },
      beforeUpdate: async (user) => {
        if (user.changed('senha')) {
          user.senha = await bcrypt.hash(user.senha, 12);
        }
      }
    }
  });

  return User;
};