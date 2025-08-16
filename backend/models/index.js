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

// Associações entre User e Department
if (db.User && db.Department) {
  db.User.belongsTo(db.Department, {
    foreignKey: 'department_id',
    as: 'department'
  });

  db.Department.hasMany(db.User, {
    foreignKey: 'department_id',
    as: 'users'
  });
}

// Associações para Solicitacao
if (db.Solicitacao && db.User && db.Department) {
  // Solicitação pertence a um solicitante (usuário)
  db.Solicitacao.belongsTo(db.User, {
    foreignKey: 'solicitante_id',
    as: 'solicitante'
  });

  // Solicitação pode ter um responsável (usuário)
  db.Solicitacao.belongsTo(db.User, {
    foreignKey: 'responsavel_id',
    as: 'responsavel'
  });

  // Solicitação pode pertencer a um departamento
  db.Solicitacao.belongsTo(db.Department, {
    foreignKey: 'department_id',
    as: 'department'
  });

  // Usuário pode ter muitas solicitações criadas
  db.User.hasMany(db.Solicitacao, {
    foreignKey: 'solicitante_id',
    as: 'solicitacoesCriadas'
  });

  // Usuário pode ser responsável por muitas solicitações
  db.User.hasMany(db.Solicitacao, {
    foreignKey: 'responsavel_id',
    as: 'solicitacoesResponsavel'
  });

  // Departamento pode ter muitas solicitações
  db.Department.hasMany(db.Solicitacao, {
    foreignKey: 'department_id',
    as: 'solicitacoes'
  });
}

// Associações para Category e SubCategory
if (db.Category && db.SubCategory && db.Solicitacao) {
  // Category -> SubCategory
  db.Category.hasMany(db.SubCategory, {
    foreignKey: 'category_id',
    as: 'subcategorias'
  });

  db.SubCategory.belongsTo(db.Category, {
    foreignKey: 'category_id',
    as: 'categoria'
  });

    // Category -> Solicitacao
  db.Category.hasMany(db.Solicitacao, {
    foreignKey: 'category_id',
    as: 'solicitacoes'
  });

  db.Solicitacao.belongsTo(db.Category, {
    foreignKey: 'category_id',
    as: 'categoriaObj'  // Mudando o alias para evitar conflito
  });

  // SubCategory -> Solicitacao
  db.SubCategory.hasMany(db.Solicitacao, {
    foreignKey: 'subcategory_id',
    as: 'solicitacoes'
  });

  db.Solicitacao.belongsTo(db.SubCategory, {
    foreignKey: 'subcategory_id',
    as: 'subcategoriaObj'  // Mudando o alias para evitar conflito
  });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
