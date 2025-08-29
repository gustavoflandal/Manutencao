const { Model, DataTypes } = require('sequelize');

class UserPermission extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    this.belongsTo(models.Permission, {
      foreignKey: 'permission_id',
      as: 'permission'
    });

    this.belongsTo(models.User, {
      foreignKey: 'granted_by',
      as: 'grantor'
    });

    this.belongsTo(models.User, {
      foreignKey: 'revoked_by',
      as: 'revoker'
    });
  }
}

module.exports = (sequelize) => {
  UserPermission.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id'
      }
    },
    granted_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'ID do usuário que concedeu a permissão'
    },
    granted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data/hora em que a permissão foi concedida'
    },
    revoked_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'ID do usuário que revogou a permissão'
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data/hora em que a permissão foi revogada'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Se a permissão está ativa'
    }
  }, {
    sequelize,
    tableName: 'user_permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'permission_id']
      }
    ]
  });

  return UserPermission;
};