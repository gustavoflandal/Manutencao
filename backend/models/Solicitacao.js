const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Solicitacao = sequelize.define('Solicitacao', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true  // Permitir null temporariamente para o hook funcionar
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
      allowNull: false
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
    tableName: 'solicitacoes',
    hooks: {
      beforeCreate: async (solicitacao, options) => {
        try {
          // Gerar número sequencial único
          const count = await sequelize.query(
            'SELECT COUNT(*) as total FROM solicitacoes', 
            { 
              type: sequelize.QueryTypes.SELECT,
              transaction: options.transaction 
            }
          );
          const nextNumber = (count[0]?.total || 0) + 1;
          solicitacao.numero = `SOL${String(nextNumber).padStart(6, '0')}`;
        } catch (error) {
          console.error('Erro ao gerar número da solicitação:', error);
          // Fallback: usar timestamp
          const timestamp = Date.now().toString().slice(-6);
          solicitacao.numero = `SOL${timestamp}`;
        }
      }
    }
  });

  return Solicitacao;
};