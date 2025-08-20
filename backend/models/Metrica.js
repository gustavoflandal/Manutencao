const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Metrica = sequelize.define('Metrica', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM(
      'tempo_medio_resolucao',
      'eficiencia_manutencao',
      'disponibilidade_ativo',
      'custo_manutencao',
      'produtividade_tecnico',
      'taxa_retrabalho',
      'consumo_estoque',
      'preventiva_vs_corretiva',
      'satisfacao_usuario',
      'kpi_personalizado'
    ),
    allowNull: false,
    comment: 'Tipo da métrica coletada'
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nome descritivo da métrica'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição detalhada da métrica'
  },
  valor: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    comment: 'Valor numérico da métrica'
  },
  unidade: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Unidade de medida (horas, %, R$, etc.)'
  },
  periodo: {
    type: DataTypes.ENUM(
      'diario',
      'semanal', 
      'mensal',
      'trimestral',
      'anual',
      'tempo_real'
    ),
    allowNull: false,
    comment: 'Período de coleta da métrica'
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Data de início do período medido'
  },
  data_fim: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Data de fim do período medido'
  },
  ativo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ativos',
      key: 'id'
    },
    comment: 'ID do ativo relacionado (se aplicável)'
  },
  setor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'setores',
      key: 'id'
    },
    comment: 'ID do setor relacionado (se aplicável)'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID do usuário relacionado (se aplicável)'
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Categoria da métrica para agrupamento'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Dados adicionais em formato JSON'
  },
  tendencia: {
    type: DataTypes.ENUM('crescente', 'decrescente', 'estavel', 'volatil'),
    allowNull: true,
    comment: 'Tendência identificada automaticamente'
  },
  meta: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: true,
    comment: 'Meta estabelecida para esta métrica'
  },
  status_meta: {
    type: DataTypes.ENUM('atingiu', 'nao_atingiu', 'superou', 'em_progresso'),
    allowNull: true,
    comment: 'Status em relação à meta'
  },
  calculado_automaticamente: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se foi calculado automaticamente ou inserido manualmente'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se a métrica está ativa para coleta'
  }
}, {
  tableName: 'metricas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_metricas_tipo',
      fields: ['tipo']
    },
    {
      name: 'idx_metricas_periodo',
      fields: ['periodo', 'data_inicio', 'data_fim']
    },
    {
      name: 'idx_metricas_ativo',
      fields: ['ativo_id']
    },
    {
      name: 'idx_metricas_setor',
      fields: ['setor_id']
    },
    {
      name: 'idx_metricas_usuario',
      fields: ['user_id']
    },
    {
      name: 'idx_metricas_categoria',
      fields: ['categoria']
    }
  ]
});

// Associações
Metrica.associate = (models) => {
  // Relacionamento com Ativo
  Metrica.belongsTo(models.Ativo, {
    foreignKey: 'ativo_id',
    as: 'ativo_relacionado'
  });

  // Relacionamento com Setor
  Metrica.belongsTo(models.Setor, {
    foreignKey: 'setor_id',
    as: 'setor'
  });

  // Relacionamento com Usuário
  Metrica.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'usuario'
  });
};

// Métodos de instância
Metrica.prototype.calcularTendencia = function() {
  // Lógica para calcular tendência baseada em valores históricos
  // Será implementada no service
  return 'estavel';
};

Metrica.prototype.verificarMeta = function() {
  if (!this.meta) return null;
  
  const percentual = (this.valor / this.meta) * 100;
  
  if (percentual >= 100) return 'atingiu';
  if (percentual >= 110) return 'superou';
  if (percentual < 100) return 'nao_atingiu';
  
  return 'em_progresso';
};

// Métodos estáticos
Metrica.getMetricasPorPeriodo = async function(tipo, dataInicio, dataFim) {
  return await this.findAll({
    where: {
      tipo: tipo,
      data_inicio: {
        [sequelize.Sequelize.Op.gte]: dataInicio
      },
      data_fim: {
        [sequelize.Sequelize.Op.lte]: dataFim
      }
    },
    order: [['data_inicio', 'ASC']]
  });
};

Metrica.getKPIsPrincipais = async function() {
  const kpis = [
    'tempo_medio_resolucao',
    'eficiencia_manutencao',
    'disponibilidade_ativo',
    'custo_manutencao'
  ];
  
  return await this.findAll({
    where: {
      tipo: kpis,
      ativo: true
    },
    order: [['created_at', 'DESC']],
    limit: 50
  });
};

module.exports = Metrica;