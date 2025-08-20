const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dashboard = sequelize.define('Dashboard', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nome do dashboard'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição do dashboard'
  },
  tipo: {
    type: DataTypes.ENUM(
      'executivo',
      'operacional',
      'tecnico',
      'gerencial',
      'personalizado'
    ),
    allowNull: false,
    comment: 'Tipo do dashboard'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Proprietário do dashboard'
  },
  configuracao: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Configuração dos widgets e layout'
  },
  widgets: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Lista de widgets e suas configurações'
  },
  filtros_padrao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Filtros padrão aplicados ao dashboard'
  },
  periodo_padrao: {
    type: DataTypes.ENUM(
      'hoje',
      'ontem',
      'ultimos_7_dias',
      'ultimos_30_dias',
      'ultimo_mes',
      'ultimos_3_meses',
      'ultimo_ano',
      'personalizado'
    ),
    defaultValue: 'ultimos_30_dias',
    comment: 'Período padrão para dados'
  },
  publico: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se o dashboard é visível para outros usuários'
  },
  compartilhado_com: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de IDs de usuários com acesso'
  },
  auto_refresh: {
    type: DataTypes.INTEGER,
    defaultValue: 300, // 5 minutos
    comment: 'Intervalo de atualização automática em segundos'
  },
  favorito: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se está marcado como favorito pelo usuário'
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Ordem de exibição na lista'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se o dashboard está ativo'
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID do template base (se criado a partir de template)'
  },
  versao: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Versão do dashboard para controle de alterações'
  },
  backup_configuracao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Backup da configuração anterior'
  }
}, {
  tableName: 'dashboards',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_dashboards_usuario',
      fields: ['user_id']
    },
    {
      name: 'idx_dashboards_tipo',
      fields: ['tipo']
    },
    {
      name: 'idx_dashboards_publico',
      fields: ['publico', 'ativo']
    },
    {
      name: 'idx_dashboards_favorito',
      fields: ['user_id', 'favorito']
    }
  ]
});

// Associações
Dashboard.associate = (models) => {
  // Relacionamento com Usuário
  Dashboard.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'proprietario'
  });

  // Relacionamento com template (auto-relacionamento)
  Dashboard.belongsTo(models.Dashboard, {
    foreignKey: 'template_id',
    as: 'template'
  });

  Dashboard.hasMany(models.Dashboard, {
    foreignKey: 'template_id',
    as: 'dashboards_criados'
  });
};

// Métodos de instância
Dashboard.prototype.duplicar = async function(novoNome, novoUserId) {
  const novoDashboard = await Dashboard.create({
    nome: novoNome || `${this.nome} (Cópia)`,
    descricao: this.descricao,
    tipo: this.tipo,
    user_id: novoUserId || this.user_id,
    configuracao: this.configuracao,
    widgets: this.widgets,
    filtros_padrao: this.filtros_padrao,
    periodo_padrao: this.periodo_padrao,
    template_id: this.id
  });
  
  return novoDashboard;
};

Dashboard.prototype.compartilhar = async function(userIds) {
  const compartilhadoAtual = this.compartilhado_com || [];
  const novosUsuarios = Array.isArray(userIds) ? userIds : [userIds];
  
  this.compartilhado_com = [...new Set([...compartilhadoAtual, ...novosUsuarios])];
  this.publico = this.compartilhado_com.length > 0;
  
  return await this.save();
};

Dashboard.prototype.removerCompartilhamento = async function(userIds) {
  if (!this.compartilhado_com) return this;
  
  const idsParaRemover = Array.isArray(userIds) ? userIds : [userIds];
  this.compartilhado_com = this.compartilhado_com.filter(id => !idsParaRemover.includes(id));
  this.publico = this.compartilhado_com.length > 0;
  
  return await this.save();
};

Dashboard.prototype.fazerBackup = async function() {
  this.backup_configuracao = {
    versao: this.versao,
    configuracao: this.configuracao,
    widgets: this.widgets,
    backup_em: new Date()
  };
  
  this.versao += 1;
  return await this.save();
};

Dashboard.prototype.restaurarBackup = async function() {
  if (!this.backup_configuracao) {
    throw new Error('Não há backup disponível para restaurar');
  }
  
  this.configuracao = this.backup_configuracao.configuracao;
  this.widgets = this.backup_configuracao.widgets;
  this.versao = this.backup_configuracao.versao;
  
  return await this.save();
};

// Métodos estáticos
Dashboard.getDashboardsPublicos = async function() {
  return await this.findAll({
    where: {
      publico: true,
      ativo: true
    },
    include: [{
      model: sequelize.models.User,
      as: 'proprietario',
      attributes: ['id', 'nome', 'email']
    }],
    order: [['created_at', 'DESC']]
  });
};

Dashboard.getDashboardsDoUsuario = async function(userId) {
  return await this.findAll({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { user_id: userId },
        {
          compartilhado_com: {
            [sequelize.Sequelize.Op.contains]: userId
          }
        }
      ],
      ativo: true
    },
    order: [['favorito', 'DESC'], ['ordem', 'ASC'], ['created_at', 'DESC']]
  });
};

Dashboard.getTemplates = async function() {
  return await this.findAll({
    where: {
      tipo: {
        [sequelize.Sequelize.Op.ne]: 'personalizado'
      },
      template_id: null,
      ativo: true
    },
    order: [['tipo', 'ASC'], ['nome', 'ASC']]
  });
};

// Templates padrão
Dashboard.criarTemplatesPadrao = async function() {
  const templates = [
    {
      nome: 'Dashboard Executivo',
      descricao: 'Visão executiva com KPIs principais',
      tipo: 'executivo',
      user_id: 1, // Admin
      configuracao: {
        layout: 'grid',
        colunas: 4,
        tema: 'claro'
      },
      widgets: [
        {
          id: 'kpi-eficiencia',
          tipo: 'kpi',
          titulo: 'Eficiência Geral',
          posicao: { x: 0, y: 0, w: 1, h: 1 },
          configuracao: { metrica: 'eficiencia_manutencao', formato: 'percentual' }
        },
        {
          id: 'kpi-disponibilidade',
          tipo: 'kpi',
          titulo: 'Disponibilidade',
          posicao: { x: 1, y: 0, w: 1, h: 1 },
          configuracao: { metrica: 'disponibilidade_ativo', formato: 'percentual' }
        },
        {
          id: 'grafico-custos',
          tipo: 'grafico_linha',
          titulo: 'Evolução de Custos',
          posicao: { x: 0, y: 1, w: 2, h: 2 },
          configuracao: { metrica: 'custo_manutencao', periodo: 'ultimos_6_meses' }
        }
      ]
    },
    {
      nome: 'Dashboard Operacional',
      descricao: 'Visão operacional detalhada',
      tipo: 'operacional',
      user_id: 1,
      configuracao: {
        layout: 'grid',
        colunas: 3,
        tema: 'claro'
      },
      widgets: [
        {
          id: 'lista-ordens',
          tipo: 'lista',
          titulo: 'Ordens Pendentes',
          posicao: { x: 0, y: 0, w: 1, h: 2 },
          configuracao: { fonte: 'ordens_servico', filtro: 'pendente' }
        },
        {
          id: 'mapa-ativos',
          tipo: 'mapa',
          titulo: 'Status dos Ativos',
          posicao: { x: 1, y: 0, w: 2, h: 2 },
          configuracao: { mostrar_alertas: true }
        }
      ]
    }
  ];

  for (const template of templates) {
    await this.findOrCreate({
      where: { nome: template.nome, tipo: template.tipo },
      defaults: template
    });
  }
};

module.exports = Dashboard;