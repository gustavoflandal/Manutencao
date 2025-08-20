const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Relatorio = sequelize.define('Relatorio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nome do relatório'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição do relatório'
  },
  tipo: {
    type: DataTypes.ENUM(
      'ordens_servico',
      'ativos',
      'manutencao_preventiva',
      'custos',
      'produtividade',
      'disponibilidade',
      'estoque',
      'kpis',
      'personalizado'
    ),
    allowNull: false,
    comment: 'Tipo do relatório'
  },
  categoria: {
    type: DataTypes.ENUM(
      'operacional',
      'gerencial',
      'estrategico',
      'financeiro',
      'tecnico'
    ),
    allowNull: false,
    comment: 'Categoria do relatório'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Usuário que criou o relatório'
  },
  query_sql: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Query SQL para relatórios personalizados'
  },
  configuracao: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Configuração do relatório (filtros, campos, etc.)'
  },
  parametros: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Parâmetros configuráveis do relatório'
  },
  colunas: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Definição das colunas do relatório'
  },
  filtros_padrao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Filtros padrão aplicados'
  },
  ordenacao_padrao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Ordenação padrão'
  },
  formato_saida: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['html', 'pdf', 'excel'],
    comment: 'Formatos de saída suportados'
  },
  agendamento: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuração de agendamento automático'
  },
  publico: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se o relatório é público'
  },
  compartilhado_com: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Usuários com acesso ao relatório'
  },
  template: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se é um template de relatório'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se o relatório está ativo'
  },
  favorito: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se está marcado como favorito'
  },
  execucoes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Número de execuções do relatório'
  },
  ultima_execucao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data da última execução'
  },
  tempo_medio_execucao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tempo médio de execução em milissegundos'
  },
  tamanho_medio_resultado: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tamanho médio do resultado em bytes'
  },
  versao: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Versão do relatório'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Tags para organização e busca'
  }
}, {
  tableName: 'relatorios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_relatorios_usuario',
      fields: ['user_id']
    },
    {
      name: 'idx_relatorios_tipo',
      fields: ['tipo']
    },
    {
      name: 'idx_relatorios_categoria',
      fields: ['categoria']
    },
    {
      name: 'idx_relatorios_publico',
      fields: ['publico', 'ativo']
    },
    {
      name: 'idx_relatorios_template',
      fields: ['template', 'ativo']
    },
    {
      name: 'idx_relatorios_favorito',
      fields: ['user_id', 'favorito']
    }
  ]
});

// Associações
Relatorio.associate = (models) => {
  // Relacionamento com Usuário
  Relatorio.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'criador'
  });

  // Relacionamento com execuções de relatórios
  Relatorio.hasMany(models.RelatorioExecucao, {
    foreignKey: 'relatorio_id',
    as: 'execucoes_historico'
  });
};

// Métodos de instância
Relatorio.prototype.executar = async function(parametrosCustom = {}) {
  const inicioExecucao = Date.now();
  
  try {
    // Merge parâmetros padrão com customizados
    const parametrosFinal = { ...this.parametros, ...parametrosCustom };
    
    let resultado;
    
    if (this.query_sql) {
      // Executar query SQL personalizada
      resultado = await this.executarQuerySQL(parametrosFinal);
    } else {
      // Executar relatório baseado na configuração
      resultado = await this.executarRelatorioConfigurado(parametrosFinal);
    }
    
    // Atualizar estatísticas
    const tempoExecucao = Date.now() - inicioExecucao;
    await this.atualizarEstatisticas(tempoExecucao, resultado);
    
    return resultado;
    
  } catch (error) {
    throw new Error(`Erro na execução do relatório: ${error.message}`);
  }
};

Relatorio.prototype.executarQuerySQL = async function(parametros) {
  let query = this.query_sql;
  
  // Substituir parâmetros na query
  for (const [key, value] of Object.entries(parametros)) {
    const regex = new RegExp(`:${key}`, 'g');
    query = query.replace(regex, sequelize.escape(value));
  }
  
  const [results] = await sequelize.query(query);
  return results;
};

Relatorio.prototype.executarRelatorioConfigurado = async function(parametros) {
  // Lógica para executar relatórios baseados na configuração
  // Será implementada no service específico
  const RelatorioService = require('../services/RelatorioService');
  return await RelatorioService.executarRelatorio(this, parametros);
};

Relatorio.prototype.atualizarEstatisticas = async function(tempoExecucao, resultado) {
  this.execucoes += 1;
  this.ultima_execucao = new Date();
  
  // Calcular tempo médio
  if (this.tempo_medio_execucao) {
    this.tempo_medio_execucao = Math.round(
      (this.tempo_medio_execucao + tempoExecucao) / 2
    );
  } else {
    this.tempo_medio_execucao = tempoExecucao;
  }
  
  // Calcular tamanho médio do resultado
  const tamanhoAtual = JSON.stringify(resultado).length;
  if (this.tamanho_medio_resultado) {
    this.tamanho_medio_resultado = Math.round(
      (this.tamanho_medio_resultado + tamanhoAtual) / 2
    );
  } else {
    this.tamanho_medio_resultado = tamanhoAtual;
  }
  
  await this.save();
};

Relatorio.prototype.duplicar = async function(novoNome, novoUserId) {
  const novoRelatorio = await Relatorio.create({
    nome: novoNome || `${this.nome} (Cópia)`,
    descricao: this.descricao,
    tipo: this.tipo,
    categoria: this.categoria,
    user_id: novoUserId || this.user_id,
    query_sql: this.query_sql,
    configuracao: this.configuracao,
    parametros: this.parametros,
    colunas: this.colunas,
    filtros_padrao: this.filtros_padrao,
    ordenacao_padrao: this.ordenacao_padrao,
    formato_saida: this.formato_saida
  });
  
  return novoRelatorio;
};

Relatorio.prototype.agendar = async function(configuracaoAgendamento) {
  this.agendamento = configuracaoAgendamento;
  await this.save();
  
  // Registrar no sistema de agendamento
  const AgendadorService = require('../services/AgendadorService');
  return await AgendadorService.agendarRelatorio(this);
};

// Métodos estáticos
Relatorio.getRelatoriosPublicos = async function() {
  return await this.findAll({
    where: {
      publico: true,
      ativo: true
    },
    include: [{
      model: sequelize.models.User,
      as: 'criador',
      attributes: ['id', 'nome', 'email']
    }],
    order: [['execucoes', 'DESC']]
  });
};

Relatorio.getRelatoriosDoUsuario = async function(userId) {
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
    order: [['favorito', 'DESC'], ['execucoes', 'DESC']]
  });
};

Relatorio.getTemplates = async function() {
  return await this.findAll({
    where: {
      template: true,
      ativo: true
    },
    order: [['categoria', 'ASC'], ['tipo', 'ASC'], ['nome', 'ASC']]
  });
};

Relatorio.getMaisExecutados = async function(limite = 10) {
  return await this.findAll({
    where: {
      ativo: true,
      execucoes: {
        [sequelize.Sequelize.Op.gt]: 0
      }
    },
    order: [['execucoes', 'DESC']],
    limit: limite
  });
};

// Templates padrão de relatórios
Relatorio.criarTemplatesPadrao = async function() {
  const templates = [
    {
      nome: 'Relatório de Ordens de Serviço',
      descricao: 'Relatório completo de ordens de serviço por período',
      tipo: 'ordens_servico',
      categoria: 'operacional',
      user_id: 1,
      template: true,
      configuracao: {
        origem: 'ordens_servico',
        joins: ['users', 'ativos', 'setores'],
        groupBy: [],
        having: []
      },
      parametros: {
        data_inicio: { tipo: 'date', obrigatorio: true },
        data_fim: { tipo: 'date', obrigatorio: true },
        status: { tipo: 'multiselect', opcoes: ['pendente', 'em_andamento', 'concluida'], obrigatorio: false },
        setor_id: { tipo: 'select', origem: 'setores', obrigatorio: false }
      },
      colunas: [
        { nome: 'id', titulo: 'ID', tipo: 'number' },
        { nome: 'titulo', titulo: 'Título', tipo: 'text' },
        { nome: 'status', titulo: 'Status', tipo: 'badge' },
        { nome: 'prioridade', titulo: 'Prioridade', tipo: 'badge' },
        { nome: 'tecnico_nome', titulo: 'Técnico', tipo: 'text' },
        { nome: 'created_at', titulo: 'Criada em', tipo: 'datetime' },
        { nome: 'tempo_resolucao', titulo: 'Tempo Resolução', tipo: 'duration' }
      ],
      ordenacao_padrao: [{ campo: 'created_at', direcao: 'DESC' }]
    },
    {
      nome: 'Relatório de Disponibilidade de Ativos',
      descricao: 'Análise de disponibilidade e tempo de inatividade dos ativos',
      tipo: 'ativos',
      categoria: 'gerencial',
      user_id: 1,
      template: true,
      configuracao: {
        origem: 'ativos',
        metricas: ['disponibilidade_ativo', 'tempo_medio_resolucao']
      },
      parametros: {
        periodo: { tipo: 'select', opcoes: ['7_dias', '30_dias', '90_dias'], default: '30_dias' },
        setor_id: { tipo: 'select', origem: 'setores', obrigatorio: false }
      },
      colunas: [
        { nome: 'nome', titulo: 'Ativo', tipo: 'text' },
        { nome: 'codigo', titulo: 'Código', tipo: 'text' },
        { nome: 'disponibilidade', titulo: 'Disponibilidade (%)', tipo: 'percentage' },
        { nome: 'tempo_inatividade', titulo: 'Tempo Inativo', tipo: 'duration' },
        { nome: 'manutencoes_realizadas', titulo: 'Manutenções', tipo: 'number' }
      ]
    },
    {
      nome: 'Relatório de Custos de Manutenção',
      descricao: 'Análise financeira dos custos de manutenção',
      tipo: 'custos',
      categoria: 'financeiro',
      user_id: 1,
      template: true,
      configuracao: {
        origem: 'ordens_servico',
        agregacoes: ['SUM(custo_total)', 'AVG(custo_total)', 'COUNT(*)']
      },
      parametros: {
        data_inicio: { tipo: 'date', obrigatorio: true },
        data_fim: { tipo: 'date', obrigatorio: true },
        tipo_manutencao: { tipo: 'multiselect', opcoes: ['preventiva', 'corretiva', 'preditiva'] }
      },
      colunas: [
        { nome: 'mes', titulo: 'Mês', tipo: 'text' },
        { nome: 'custo_total', titulo: 'Custo Total', tipo: 'currency' },
        { nome: 'custo_medio', titulo: 'Custo Médio', tipo: 'currency' },
        { nome: 'numero_ordens', titulo: 'Nº Ordens', tipo: 'number' },
        { nome: 'custo_por_ordem', titulo: 'Custo/Ordem', tipo: 'currency' }
      ]
    }
  ];

  for (const template of templates) {
    await this.findOrCreate({
      where: { nome: template.nome, template: true },
      defaults: template
    });
  }
};

module.exports = Relatorio;