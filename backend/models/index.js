const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const db = {};

// Carrega todos os modelos automaticamente
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Configura associações entre modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Configurar associações específicas
if (db.User && db.Permission && db.UserPermission) {
  // Relacionamento many-to-many entre User e Permission através de UserPermission
  db.User.belongsToMany(db.Permission, {
    through: db.UserPermission,
    foreignKey: 'user_id',
    otherKey: 'permission_id',
    as: 'permissions'
  });

  db.Permission.belongsToMany(db.User, {
    through: db.UserPermission,
    foreignKey: 'permission_id',
    otherKey: 'user_id',
    as: 'users'
  });

  // Relacionamentos diretos para UserPermission
  db.UserPermission.belongsTo(db.User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  db.UserPermission.belongsTo(db.Permission, {
    foreignKey: 'permission_id',
    as: 'permission'
  });

  db.UserPermission.belongsTo(db.User, {
    foreignKey: 'granted_by',
    as: 'grantedBy'
  });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
