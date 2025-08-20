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

// Associações para Solicitacao - removidas para evitar duplicação
// As associações estão definidas nos modelos individuais através do método associate

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

    // Category -> Solicitacao (apenas se não foi definida no modelo)
  if (!db.Category.associations.solicitacoes) {
    db.Category.hasMany(db.Solicitacao, {
      foreignKey: 'category_id',
      as: 'solicitacoes'
    });
  }

  // SubCategory -> Solicitacao (apenas se não foi definida no modelo)  
  if (!db.SubCategory.associations.solicitacoes) {
    db.SubCategory.hasMany(db.Solicitacao, {
      foreignKey: 'subcategory_id',
      as: 'solicitacoes'
    });
  }
}

// Associações para Notificacao
if (db.Notificacao && db.User) {
  // As associações já são definidas no modelo Notificacao.js através do método associate
  // Não precisamos redefini-las aqui para evitar conflitos
}

// Associações para ConfiguracaoNotificacao
if (db.ConfiguracaoNotificacao && db.User) {
  // As associações já são definidas no modelo ConfiguracaoNotificacao.js através do método associate
  // Não precisamos redefini-las aqui para evitar conflitos
}

// Associações para Workflow
if (db.Workflow && db.User && db.Setor && db.WorkflowInstancia) {
  // As associações já são definidas nos modelos através do método associate
  // Verificar se existem antes de criar para evitar conflitos
  if (!db.Workflow.associations.criador) {
    db.Workflow.belongsTo(db.User, {
      foreignKey: 'user_id',
      as: 'criador'
    });
  }

  if (!db.Workflow.associations.setor) {
    db.Workflow.belongsTo(db.Setor, {
      foreignKey: 'setor_id',
      as: 'setor'
    });
  }

  if (!db.Workflow.associations.instancias) {
    db.Workflow.hasMany(db.WorkflowInstancia, {
      foreignKey: 'workflow_id',
      as: 'instancias'
    });
  }
}

// Associações para WorkflowInstancia
if (db.WorkflowInstancia && db.Workflow && db.User && db.WorkflowAcao) {
  // As associações já são definidas nos modelos através do método associate
  // Verificar se existem antes de criar para evitar conflitos
  if (!db.WorkflowInstancia.associations.workflow) {
    db.WorkflowInstancia.belongsTo(db.Workflow, {
      foreignKey: 'workflow_id',
      as: 'workflow'
    });
  }

  if (!db.WorkflowInstancia.associations.iniciador) {
    db.WorkflowInstancia.belongsTo(db.User, {
      foreignKey: 'user_iniciador_id',
      as: 'iniciador'
    });
  }

  if (!db.WorkflowInstancia.associations.responsavel) {
    db.WorkflowInstancia.belongsTo(db.User, {
      foreignKey: 'user_responsavel_id',
      as: 'responsavel'
    });
  }

  if (!db.WorkflowInstancia.associations.aprovador_atual) {
    db.WorkflowInstancia.belongsTo(db.User, {
      foreignKey: 'aprovador_atual_id',
      as: 'aprovador_atual'
    });
  }

  if (!db.WorkflowInstancia.associations.acoes) {
    db.WorkflowInstancia.hasMany(db.WorkflowAcao, {
      foreignKey: 'instancia_id',
      as: 'acoes'
    });
  }
}

// Associações para WorkflowAcao
if (db.WorkflowAcao && db.WorkflowInstancia && db.User) {
  // As associações já são definidas nos modelos através do método associate
  // Verificar se existem antes de criar para evitar conflitos
  if (!db.WorkflowAcao.associations.instancia) {
    db.WorkflowAcao.belongsTo(db.WorkflowInstancia, {
      foreignKey: 'instancia_id',
      as: 'instancia'
    });
  }

  if (!db.WorkflowAcao.associations.usuario) {
    db.WorkflowAcao.belongsTo(db.User, {
      foreignKey: 'user_id',
      as: 'usuario'
    });
  }
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
