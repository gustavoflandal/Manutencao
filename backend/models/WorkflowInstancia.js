const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkflowInstancia = sequelize.define('WorkflowInstancia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workflow_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'workflows',
      key: 'id'
    },
    comment: 'ID do workflow'
  },
  numero: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Número único da instância'
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Título da instância do workflow'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição da instância'
  },
  estado_atual: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Estado atual do workflow'
  },
  status: {
    type: DataTypes.ENUM(
      'ativo',
      'pausado',
      'concluido',
      'cancelado',
      'erro',
      'expirado'
    ),
    defaultValue: 'ativo',
    comment: 'Status da instância'
  },
  prioridade: {
    type: DataTypes.ENUM('baixa', 'normal', 'alta', 'critica'),
    defaultValue: 'normal',
    comment: 'Prioridade da instância'
  },
  user_iniciador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Usuário que iniciou o workflow'
  },
  user_responsavel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Usuário responsável atual'
  },
  aprovador_atual_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Aprovador atual (se em processo de aprovação)'
  },
  dados_contexto: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Dados de contexto da instância'
  },
  campos_customizados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Valores dos campos customizados'
  },
  historico_estados: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Histórico de mudanças de estado'
  },
  historico_aprovacoes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Histórico de aprovações/rejeições'
  },
  comentarios: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Comentários adicionados durante o processo'
  },
  anexos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Lista de anexos da instância'
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Data de início da instância'
  },
  data_conclusao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de conclusão da instância'
  },
  prazo_limite: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Prazo limite para conclusão'
  },
  tempo_execucao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tempo total de execução em minutos'
  },
  nivel_aprovacao_atual: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Nível de aprovação atual'
  },
  escalacao_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Número de escalações realizadas'
  },
  data_ultima_escalacao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data da última escalação'
  },
  origem_tipo: {
    type: DataTypes.ENUM(
      'ordem_servico',
      'solicitacao',
      'ativo',
      'manual',
      'sistema',
      'agenda'
    ),
    allowNull: true,
    comment: 'Tipo da origem que disparou o workflow'
  },
  origem_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID do registro que originou o workflow'
  },
  resultado_final: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Resultado final da execução'
  },
  metricas: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Métricas coletadas durante a execução'
  },
  notificacoes_enviadas: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Log de notificações enviadas'
  },
  configuracao_snapshot: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Snapshot da configuração do workflow no momento da execução'
  }
}, {
  tableName: 'workflow_instancias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_workflow_instancias_workflow',
      fields: ['workflow_id']
    },
    {
      name: 'idx_workflow_instancias_estado',
      fields: ['estado_atual']
    },
    {
      name: 'idx_workflow_instancias_status',
      fields: ['status']
    },
    {
      name: 'idx_workflow_instancias_prioridade',
      fields: ['prioridade']
    },
    {
      name: 'idx_workflow_instancias_usuario_iniciador',
      fields: ['user_iniciador_id']
    },
    {
      name: 'idx_workflow_instancias_responsavel',
      fields: ['user_responsavel_id']
    },
    {
      name: 'idx_workflow_instancias_aprovador',
      fields: ['aprovador_atual_id']
    },
    {
      name: 'idx_workflow_instancias_numero',
      fields: ['numero']
    },
    {
      name: 'idx_workflow_instancias_origem',
      fields: ['origem_tipo', 'origem_id']
    },
    {
      name: 'idx_workflow_instancias_prazo',
      fields: ['prazo_limite', 'status']
    }
  ],
  hooks: {
    beforeCreate: async (instancia) => {
      // Gerar número único da instância
      if (!instancia.numero) {
        const workflow = await require('./Workflow').findByPk(instancia.workflow_id);
        const count = await WorkflowInstancia.count({
          where: { workflow_id: instancia.workflow_id }
        });
        
        const prefixo = workflow.tipo.toUpperCase().substr(0, 3);
        instancia.numero = `${prefixo}-${String(count + 1).padStart(6, '0')}`;
      }
      
      // Definir título se não fornecido
      if (!instancia.titulo) {
        const workflow = await require('./Workflow').findByPk(instancia.workflow_id);
        instancia.titulo = `${workflow.nome} #${instancia.numero}`;
      }
    },
    
    beforeUpdate: (instancia) => {
      // Calcular tempo de execução se concluído
      if (instancia.changed('status') && ['concluido', 'cancelado'].includes(instancia.status)) {
        if (!instancia.data_conclusao) {
          instancia.data_conclusao = new Date();
        }
        
        const tempoMs = instancia.data_conclusao - instancia.data_inicio;
        instancia.tempo_execucao = Math.floor(tempoMs / (1000 * 60)); // minutos
      }
    }
  }
});

// Associações
WorkflowInstancia.associate = (models) => {
  // Relacionamento com Workflow
  WorkflowInstancia.belongsTo(models.Workflow, {
    foreignKey: 'workflow_id',
    as: 'workflow'
  });

  // Relacionamento com Usuário Iniciador
  WorkflowInstancia.belongsTo(models.User, {
    foreignKey: 'user_iniciador_id',
    as: 'iniciador'
  });

  // Relacionamento com Usuário Responsável
  WorkflowInstancia.belongsTo(models.User, {
    foreignKey: 'user_responsavel_id',
    as: 'responsavel'
  });

  // Relacionamento com Aprovador Atual
  WorkflowInstancia.belongsTo(models.User, {
    foreignKey: 'aprovador_atual_id',
    as: 'aprovador_atual'
  });

  // Relacionamento com Ações do Workflow
  WorkflowInstancia.hasMany(models.WorkflowAcao, {
    foreignKey: 'instancia_id',
    as: 'acoes'
  });
};

// Métodos de instância
WorkflowInstancia.prototype.transicionarEstado = async function(proximoEstado, usuarioId, observacoes = '', dadosAdicionais = {}) {
  const Workflow = require('./Workflow');
  const workflow = await Workflow.findByPk(this.workflow_id);
  
  // Validar transição
  const validacao = workflow.validarTransicao(
    this.estado_atual, 
    proximoEstado, 
    { id: usuarioId }, 
    { ...this.dados_contexto, ...dadosAdicionais }
  );
  
  if (!validacao.valido) {
    throw new Error(`Transição inválida: ${validacao.erro}`);
  }
  
  // Registrar no histórico
  const novoRegistroHistorico = {
    estado_anterior: this.estado_atual,
    estado_novo: proximoEstado,
    data: new Date(),
    usuario_id: usuarioId,
    observacoes: observacoes,
    dados_transicao: dadosAdicionais
  };
  
  const historicoAtualizado = [...this.historico_estados, novoRegistroHistorico];
  
  // Atualizar estado
  await this.update({
    estado_atual: proximoEstado,
    historico_estados: historicoAtualizado,
    user_responsavel_id: dadosAdicionais.novo_responsavel_id || this.user_responsavel_id
  });
  
  // Verificar se chegou a um estado final
  if (workflow.estados_finais.includes(proximoEstado)) {
    await this.finalizar(proximoEstado === 'aprovada' ? 'concluido' : 'cancelado');
  }
  
  // Executar ações automáticas da transição
  await this.executarAcoesTransicao(validacao.transicao, usuarioId);
  
  return this;
};

WorkflowInstancia.prototype.executarAcoesTransicao = async function(transicao, usuarioId) {
  if (!transicao.acoes) return;
  
  for (const acao of transicao.acoes) {
    try {
      await this.executarAcao(acao, usuarioId);
    } catch (error) {
      console.error(`Erro ao executar ação ${acao.tipo}:`, error);
      // Continuar executando outras ações mesmo se uma falhar
    }
  }
};

WorkflowInstancia.prototype.executarAcao = async function(acao, usuarioId) {
  const WorkflowAcao = require('./WorkflowAcao');
  
  const registroAcao = await WorkflowAcao.create({
    instancia_id: this.id,
    tipo: acao.tipo,
    configuracao: acao.configuracao || {},
    user_id: usuarioId,
    status: 'pendente'
  });
  
  try {
    switch (acao.tipo) {
      case 'enviar_notificacao':
        await this.enviarNotificacao(acao.configuracao);
        break;
      case 'atualizar_origem':
        await this.atualizarOrigemRelacionada(acao.configuracao);
        break;
      case 'definir_responsavel':
        await this.definirResponsavel(acao.configuracao.user_id);
        break;
      case 'definir_prazo':
        await this.definirPrazo(acao.configuracao.horas);
        break;
      case 'escalar_automaticamente':
        await this.escalarAutomaticamente();
        break;
      default:
        throw new Error(`Tipo de ação não suportado: ${acao.tipo}`);
    }
    
    await registroAcao.update({
      status: 'executada',
      data_execucao: new Date()
    });
    
  } catch (error) {
    await registroAcao.update({
      status: 'erro',
      erro: error.message,
      data_execucao: new Date()
    });
    throw error;
  }
};

WorkflowInstancia.prototype.enviarNotificacao = async function(config) {
  // Integrar com sistema de notificações existente
  const notificacao = {
    destinatarios: config.destinatarios || [this.user_responsavel_id],
    titulo: config.titulo || `Workflow ${this.numero} - ${this.titulo}`,
    mensagem: config.mensagem || `Estado atual: ${this.estado_atual}`,
    tipo: config.tipo || 'workflow',
    dados_extras: {
      instancia_id: this.id,
      workflow_id: this.workflow_id,
      numero: this.numero
    },
    data_envio: new Date()
  };
  
  // Adicionar ao log de notificações
  const notificacoesEnviadas = [...(this.notificacoes_enviadas || []), notificacao];
  await this.update({ notificacoes_enviadas: notificacoesEnviadas });
  
  // Aqui integraria com o sistema de notificações real
  console.log('Notificação enviada:', notificacao);
};

WorkflowInstancia.prototype.atualizarOrigemRelacionada = async function(config) {
  if (!this.origem_tipo || !this.origem_id) return;
  
  // Atualizar registro relacionado baseado no tipo de origem
  switch (this.origem_tipo) {
    case 'ordem_servico':
      // Atualizar ordem de serviço
      break;
    case 'solicitacao':
      // Atualizar solicitação
      break;
    // Adicionar outros tipos conforme necessário
  }
};

WorkflowInstancia.prototype.definirResponsavel = async function(userId) {
  await this.update({
    user_responsavel_id: userId
  });
};

WorkflowInstancia.prototype.definirPrazo = async function(horas) {
  const novoPrazo = new Date();
  novoPrazo.setHours(novoPrazo.getHours() + horas);
  
  await this.update({
    prazo_limite: novoPrazo
  });
};

WorkflowInstancia.prototype.escalarAutomaticamente = async function() {
  const workflow = await require('./Workflow').findByPk(this.workflow_id);
  
  if (!workflow.escalacao_config || !workflow.escalacao_config.automatica) {
    return;
  }
  
  // Lógica de escalação automática
  const proximoNivel = (this.nivel_aprovacao_atual || 0) + 1;
  const configEscalacao = workflow.niveis_aprovacao.find(n => n.nivel === proximoNivel);
  
  if (configEscalacao) {
    await this.update({
      nivel_aprovacao_atual: proximoNivel,
      escalacao_count: this.escalacao_count + 1,
      data_ultima_escalacao: new Date()
    });
    
    // Enviar notificação de escalação
    await this.enviarNotificacao({
      destinatarios: configEscalacao.aprovadores,
      titulo: `Escalação Automática - ${this.numero}`,
      mensagem: `Workflow escalado para nível ${proximoNivel}`,
      tipo: 'escalacao'
    });
  }
};

WorkflowInstancia.prototype.finalizar = async function(statusFinal = 'concluido') {
  const agora = new Date();
  const tempoExecucao = Math.floor((agora - this.data_inicio) / (1000 * 60));
  
  await this.update({
    status: statusFinal,
    data_conclusao: agora,
    tempo_execucao: tempoExecucao
  });
  
  // Coletar métricas finais
  await this.coletarMetricas();
};

WorkflowInstancia.prototype.coletarMetricas = async function() {
  const metricas = {
    tempo_total_execucao: this.tempo_execucao,
    numero_transicoes: this.historico_estados.length,
    numero_escalacoes: this.escalacao_count,
    prazo_cumprido: this.prazo_limite ? this.data_conclusao <= this.prazo_limite : null,
    tempo_por_estado: this.calcularTempoPorEstado(),
    eficiencia: this.calcularEficiencia()
  };
  
  await this.update({ metricas: metricas });
  
  return metricas;
};

WorkflowInstancia.prototype.calcularTempoPorEstado = function() {
  const tempoPorEstado = {};
  
  for (let i = 0; i < this.historico_estados.length; i++) {
    const estado = this.historico_estados[i];
    const proximoEstado = this.historico_estados[i + 1];
    
    const dataInicio = new Date(estado.data);
    const dataFim = proximoEstado ? new Date(proximoEstado.data) : (this.data_conclusao || new Date());
    
    const tempoMinutos = Math.floor((dataFim - dataInicio) / (1000 * 60));
    
    tempoPorEstado[estado.estado_novo || estado.estado] = tempoMinutos;
  }
  
  return tempoPorEstado;
};

WorkflowInstancia.prototype.calcularEficiencia = function() {
  if (!this.prazo_limite || !this.data_conclusao) return null;
  
  const tempoUsado = this.data_conclusao - this.data_inicio;
  const tempoDisponivel = this.prazo_limite - this.data_inicio;
  
  return Math.max(0, Math.min(100, ((tempoDisponivel - tempoUsado) / tempoDisponivel) * 100));
};

WorkflowInstancia.prototype.pausar = async function(motivo, usuarioId) {
  await this.update({
    status: 'pausado'
  });
  
  // Registrar no histórico
  const novoRegistro = {
    estado_anterior: this.estado_atual,
    estado_novo: this.estado_atual,
    data: new Date(),
    usuario_id: usuarioId,
    observacoes: `Workflow pausado: ${motivo}`,
    acao: 'pausado'
  };
  
  const historicoAtualizado = [...this.historico_estados, novoRegistro];
  await this.update({ historico_estados: historicoAtualizado });
};

WorkflowInstancia.prototype.reativar = async function(usuarioId) {
  await this.update({
    status: 'ativo'
  });
  
  // Registrar no histórico
  const novoRegistro = {
    estado_anterior: this.estado_atual,
    estado_novo: this.estado_atual,
    data: new Date(),
    usuario_id: usuarioId,
    observacoes: 'Workflow reativado',
    acao: 'reativado'
  };
  
  const historicoAtualizado = [...this.historico_estados, novoRegistro];
  await this.update({ historico_estados: historicoAtualizado });
};

WorkflowInstancia.prototype.adicionarComentario = async function(comentario, usuarioId, publico = true) {
  const novoComentario = {
    id: Date.now(),
    usuario_id: usuarioId,
    comentario: comentario,
    data: new Date(),
    publico: publico
  };
  
  const comentariosAtualizados = [...(this.comentarios || []), novoComentario];
  await this.update({ comentarios: comentariosAtualizados });
  
  return novoComentario;
};

// Métodos estáticos
WorkflowInstancia.getInstanciasAtivas = async function() {
  return await this.findAll({
    where: {
      status: 'ativo'
    },
    include: ['workflow', 'iniciador', 'responsavel'],
    order: [['prioridade', 'DESC'], ['data_inicio', 'ASC']]
  });
};

WorkflowInstancia.getInstanciasVencidas = async function() {
  return await this.findAll({
    where: {
      status: 'ativo',
      prazo_limite: {
        [require('sequelize').Op.lt]: new Date()
      }
    },
    include: ['workflow', 'responsavel']
  });
};

WorkflowInstancia.getInstanciasPorUsuario = async function(userId, status = null) {
  const where = {
    [require('sequelize').Op.or]: [
      { user_iniciador_id: userId },
      { user_responsavel_id: userId },
      { aprovador_atual_id: userId }
    ]
  };
  
  if (status) {
    where.status = status;
  }
  
  return await this.findAll({
    where: where,
    include: ['workflow'],
    order: [['created_at', 'DESC']]
  });
};

WorkflowInstancia.estatisticas = async function(filtros = {}) {
  const where = {};
  
  if (filtros.data_inicio) {
    where.data_inicio = {
      [require('sequelize').Op.gte]: filtros.data_inicio
    };
  }
  
  if (filtros.data_fim) {
    where.data_inicio = {
      ...where.data_inicio,
      [require('sequelize').Op.lte]: filtros.data_fim
    };
  }
  
  const total = await this.count({ where });
  const concluidas = await this.count({ where: { ...where, status: 'concluido' } });
  const ativas = await this.count({ where: { ...where, status: 'ativo' } });
  const vencidas = await this.count({
    where: {
      ...where,
      status: 'ativo',
      prazo_limite: {
        [require('sequelize').Op.lt]: new Date()
      }
    }
  });
  
  return {
    total,
    concluidas,
    ativas,
    vencidas,
    taxa_conclusao: total > 0 ? Math.round((concluidas / total) * 100) : 0
  };
};

module.exports = WorkflowInstancia;