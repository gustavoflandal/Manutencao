const { Model, DataTypes } = require('sequelize');

class Solicitacao extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'solicitante_id',
      as: 'solicitante'
    });

    this.belongsTo(models.User, {
      foreignKey: 'responsavel_id',
      as: 'responsavel'
    });

    this.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department'
    });

    this.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });

    this.belongsTo(models.SubCategory, {
      foreignKey: 'subcategory_id',
      as: 'subcategory'
    });

    this.belongsTo(models.Ativo, {
      foreignKey: 'ativo_id',
      as: 'ativo'
    });

    this.belongsTo(models.Setor, {
      foreignKey: 'setor_id',
      as: 'setor'
    });

    this.hasMany(models.OrdemServico, {
      foreignKey: 'solicitacao_id',
      as: 'ordens_servico'
    });
  }
}

module.exports = (sequelize) => {
  Solicitacao.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false  // Campo obrigatório após hook
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    categoria: {
      type: DataTypes.ENUM('predial', 'industrial', 'ti', 'infraestrutura'),
      allowNull: true  // Manter temporariamente para compatibilidade
    },
    subcategoria: {
      type: DataTypes.STRING(100)
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    subcategory_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'subcategories',
        key: 'id'
      }
    },
    ativo_id: {
      type: DataTypes.INTEGER,
      allowNull: false, // Agora obrigatório
      references: {
        model: 'ativos',
        key: 'id'
      }
    },
    setor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'setores',
        key: 'id'
      }
    },
    prioridade: {
      type: DataTypes.ENUM('baixa', 'normal', 'alta', 'critica'),
      defaultValue: 'normal'
    },
    status: {
      type: DataTypes.ENUM('aberta', 'em_analise', 'aprovada', 'em_execucao', 'fechada', 'cancelada'),
      defaultValue: 'aberta'
    },
    localizacao: {
      type: DataTypes.STRING(200),
      allowNull: true // Tornando opcional pois nem sempre é necessário
    },
    observacoes: {
      type: DataTypes.TEXT
    },
    data_prevista: {
      type: DataTypes.DATE
    },
    data_fechamento: {
      type: DataTypes.DATE
    },
    solicitante_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'solicitacoes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (solicitacao, options) => {
        // Se o número já foi definido, não sobrescrever
        if (solicitacao.numero) return;

        try {
          // Buscar o maior número existente
          const ultimaSolicitacao = await sequelize.query(
            `SELECT numero FROM solicitacoes 
             WHERE numero LIKE 'SOL%' 
             ORDER BY CAST(SUBSTRING(numero, 4) AS UNSIGNED) DESC 
             LIMIT 1`, 
            { 
              type: sequelize.QueryTypes.SELECT,
              transaction: options.transaction 
            }
          );

          let proximoNumero = 1;
          
          if (ultimaSolicitacao.length > 0) {
            const ultimoNumeroStr = ultimaSolicitacao[0].numero;
            const ultimoNumero = parseInt(ultimoNumeroStr.substring(3));
            proximoNumero = ultimoNumero + 1;
          }

          solicitacao.numero = `SOL${String(proximoNumero).padStart(6, '0')}`;
          
        } catch (error) {
          console.error('Erro ao gerar número da solicitação:', error);
          // Fallback: usar timestamp + random
          const timestamp = Date.now().toString().slice(-4);
          const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
          solicitacao.numero = `SOL${timestamp}${random}`;
        }
      }
    }
  });

  return Solicitacao;
};