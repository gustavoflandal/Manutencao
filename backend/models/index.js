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
    try {
      const modelExport = require(path.join(__dirname, file));
      let model;
      
      // Verifica se é uma função factory ou um modelo já definido
      if (typeof modelExport === 'function') {
        // É uma função factory (padrão antigo)
        try {
          model = modelExport(sequelize, Sequelize.DataTypes);
        } catch (err) {
          console.log(`Tentando carregar ${file} como modelo direto...`);
          model = modelExport;
        }
      } else if (modelExport && modelExport.name) {
        // É um modelo já definido (padrão novo dos workflows)
        model = modelExport;
      }
      
      if (model && model.name) {
        db[model.name] = model;
        console.log(`✅ Modelo ${model.name} carregado de ${file}`);
      } else {
        console.log(`⚠️ Modelo em ${file} não pôde ser carregado`);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar modelo ${file}:`, error.message);
    }
  });

// Configura associações entre modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;