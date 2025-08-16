const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
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
    tableName: 'users',
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

  User.prototype.validatePassword = async function(senha) {
    return bcrypt.compare(senha, this.senha);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.senha;
    return values;
  };

  return User;
};