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
      allowNull: false
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
      allowNull: false
    },
    subcategoria: {
      type: DataTypes.STRING(100)
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
    }
  }, {
    tableName: 'solicitacoes',
    hooks: {
      beforeCreate: async (solicitacao) => {
        // Gerar número sequencial
        const count = await Solicitacao.count();
        solicitacao.numero = `SOL${String(count + 1).padStart(6, '0')}`;
      }
    }
  });

  return Solicitacao;
};