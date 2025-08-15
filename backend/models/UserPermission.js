const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPermission = sequelize.define('UserPermission', {
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
      },
      onDelete: 'CASCADE'
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    granted_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Usuário que concedeu a permissão'
    },
    granted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Data e hora quando a permissão foi concedida'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de expiração da permissão (opcional)'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Se esta permissão específica está ativa'
    }
  }, {
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
