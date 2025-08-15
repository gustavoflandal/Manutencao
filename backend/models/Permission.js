const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Nome único da permissão'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descrição detalhada da permissão'
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Módulo do sistema (users, maintenance, reports, etc.)'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Ação específica (create, read, update, delete, manage)'
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Recurso específico dentro do módulo'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Se a permissão está ativa no sistema'
    }
  }, {
    tableName: 'permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['module', 'action', 'resource']
      }
    ]
  });

  return Permission;
};
