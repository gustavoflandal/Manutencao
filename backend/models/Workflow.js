const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Workflow = sequelize.define('Workflow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nome do workflow'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição do workflow'
  },
  tipo: {
    type: DataTypes.ENUM(
      'aprovacao_ordem_servico',
      'aprovacao_compra',
      'aprovacao_orcamento',
      'escalacao_problema',
      'processo_manutencao',
      'aprovacao_usuario',
      'workflow_personalizado'
    ),
    allowNull: false,
    comment: 'Tipo do workflow'
  },
  categoria: {
    type: DataTypes.ENUM(
      'operacional',
      'financeiro',
      'administrativo',
      'tecnico',
      'emergencial'
    ),
    allowNull: false,
    comment: 'Categoria do workflow'
  },
  trigger_evento: {
    type: DataTypes.ENUM(
      'criacao_ordem',
      'mudanca_status',
      'valor_limite',
      'tempo_limite',
      'manual',
      'agendado',
      'condicional'
    ),
    allowNull: false,
    comment: 'Evento que dispara o workflow'
  },
  condicoes_trigger: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Condições específicas para disparar o workflow'
  },
  estados: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Definição dos estados do workflow'
  },
  transicoes: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Definição das transições entre estados'
  },
  estado_inicial: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Estado inicial do workflow'
  },
  estados_finais: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Estados que finalizam o workflow'
  },
  niveis_aprovacao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuração dos níveis de aprovação'
  },
  escalacao_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuração de escalação automática'
  },
  notificacoes_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuração de notificações do workflow'
  },
  prazo_maximo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Prazo máximo em horas para conclusão'
  },
  prioridade_padrao: {
    type: DataTypes.ENUM('baixa', 'normal', 'alta', 'critica'),
    defaultValue: 'normal',
    comment: 'Prioridade padrão das instâncias'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Usuário que criou o workflow'
  },
  setor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'setores',
      key: 'id'
    },
    comment: 'Setor responsável pelo workflow'
  },
  template: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se é um template de workflow'
  },
  publico: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se o workflow é público'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se o workflow está ativo'
  },
  versao: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Versão do workflow'
  },
  aprovadores_padrao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de aprovadores padrão por nível'
  },
  campos_customizados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Campos customizados para o workflow'
  },
  integracao_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configurações de integração com outros sistemas'
  },
  metricas_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuração de métricas do workflow'
  },
  backup_configuracao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Backup da configuração anterior'
  }
}, {
  tableName: 'workflows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_workflows_tipo',
      fields: ['tipo']
    },
    {
      name: 'idx_workflows_categoria',
      fields: ['categoria']
    },
    {
      name: 'idx_workflows_trigger',
      fields: ['trigger_evento']
    },
    {
      name: 'idx_workflows_usuario',
      fields: ['user_id']
    },
    {
      name: 'idx_workflows_setor',
      fields: ['setor_id']
    },
    {
      name: 'idx_workflows_ativo',
      fields: ['ativo', 'template']
    }
  ]
});

// Associações
Workflow.associate = (models) => {
  // Relacionamento com Usuário
  Workflow.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'criador'
  });

  // Relacionamento com Setor
  Workflow.belongsTo(models.Setor, {
    foreignKey: 'setor_id',
    as: 'setor'
  });

  // Relacionamento com Instâncias do Workflow
  Workflow.hasMany(models.WorkflowInstancia, {
    foreignKey: 'workflow_id',
    as: 'instancias'
  });
};

// Métodos de instância
Workflow.prototype.criarInstancia = async function(dadosIniciais = {}, usuarioIniciador) {
  const WorkflowInstancia = require('./WorkflowInstancia');
  
  return await WorkflowInstancia.create({
    workflow_id: this.id,
    estado_atual: this.estado_inicial,
    dados_contexto: dadosIniciais,
    user_iniciador_id: usuarioIniciador,
    prioridade: this.prioridade_padrao,
    prazo_limite: this.calcularPrazoLimite(),
    historico_estados: [{
      estado: this.estado_inicial,
      data: new Date(),
      usuario_id: usuarioIniciador,
      acao: 'iniciado',
      observacoes: 'Workflow iniciado'
    }]
  });
};

Workflow.prototype.calcularPrazoLimite = function() {
  if (!this.prazo_maximo) return null;
  
  const agora = new Date();
  return new Date(agora.getTime() + this.prazo_maximo * 60 * 60 * 1000);
};

Workflow.prototype.validarTransicao = function(estadoAtual, proximoEstado, usuario, dadosContexto = {}) {
  // Verificar se a transição existe
  const transicao = this.transicoes.find(t => 
    t.de === estadoAtual && t.para === proximoEstado
  );
  
  if (!transicao) {
    return { valido: false, erro: 'Transição não permitida' };
  }
  
  // Verificar condições da transição
  if (transicao.condicoes) {
    const resultado = this.avaliarCondicoes(transicao.condicoes, dadosContexto, usuario);
    if (!resultado.valido) {
      return resultado;
    }
  }
  
  // Verificar permissões do usuário
  if (transicao.permissoes_necessarias) {
    const temPermissao = this.verificarPermissoes(usuario, transicao.permissoes_necessarias);
    if (!temPermissao) {
      return { valido: false, erro: 'Usuário sem permissão para esta transição' };
    }
  }
  
  return { valido: true, transicao: transicao };
};

Workflow.prototype.avaliarCondicoes = function(condicoes, dadosContexto, usuario) {
  // Implementar lógica de avaliação de condições
  // Exemplo: valor >= 1000, aprovador_nivel >= 2, etc.
  
  for (const condicao of condicoes) {
    if (!this.avaliarCondicaoIndividual(condicao, dadosContexto, usuario)) {
      return { 
        valido: false, 
        erro: `Condição não atendida: ${condicao.descricao || 'Condição não especificada'}` 
      };
    }
  }
  
  return { valido: true };
};

Workflow.prototype.avaliarCondicaoIndividual = function(condicao, dadosContexto, usuario) {
  const { campo, operador, valor } = condicao;
  const valorContexto = dadosContexto[campo];
  
  switch (operador) {
    case 'maior_que':
      return parseFloat(valorContexto) > parseFloat(valor);
    case 'menor_que':
      return parseFloat(valorContexto) < parseFloat(valor);
    case 'igual':
      return valorContexto == valor;
    case 'diferente':
      return valorContexto != valor;
    case 'contem':
      return String(valorContexto).includes(valor);
    case 'usuario_perfil':
      return usuario.perfil === valor;
    case 'usuario_setor':
      return usuario.setor_id == valor;
    default:
      return true;
  }
};

Workflow.prototype.verificarPermissoes = function(usuario, permissoesNecessarias) {
  // Implementar verificação de permissões
  // Integrar com sistema de permissões existente
  return true; // Simplificado por enquanto
};

Workflow.prototype.obterProximosEstados = function(estadoAtual, usuario, dadosContexto = {}) {
  const proximosEstados = [];
  
  for (const transicao of this.transicoes) {
    if (transicao.de === estadoAtual) {
      const validacao = this.validarTransicao(estadoAtual, transicao.para, usuario, dadosContexto);
      if (validacao.valido) {
        proximosEstados.push({
          estado: transicao.para,
          titulo: transicao.titulo || transicao.para,
          descricao: transicao.descricao,
          requer_observacao: transicao.requer_observacao || false,
          campos_obrigatorios: transicao.campos_obrigatorios || []
        });
      }
    }
  }
  
  return proximosEstados;
};

Workflow.prototype.duplicar = async function(novoNome, novoUserId) {
  const novoWorkflow = await Workflow.create({
    nome: novoNome || `${this.nome} (Cópia)`,
    descricao: this.descricao,
    tipo: this.tipo,
    categoria: this.categoria,
    trigger_evento: this.trigger_evento,
    condicoes_trigger: this.condicoes_trigger,
    estados: this.estados,
    transicoes: this.transicoes,
    estado_inicial: this.estado_inicial,
    estados_finais: this.estados_finais,
    niveis_aprovacao: this.niveis_aprovacao,
    escalacao_config: this.escalacao_config,
    notificacoes_config: this.notificacoes_config,
    prazo_maximo: this.prazo_maximo,
    prioridade_padrao: this.prioridade_padrao,
    user_id: novoUserId || this.user_id,
    setor_id: this.setor_id,
    aprovadores_padrao: this.aprovadores_padrao,
    campos_customizados: this.campos_customizados
  });
  
  return novoWorkflow;
};

// Métodos estáticos
Workflow.getWorkflowsPorTipo = async function(tipo) {
  return await this.findAll({
    where: {
      tipo: tipo,
      ativo: true
    },
    order: [['nome', 'ASC']]
  });
};

Workflow.getTemplates = async function() {
  return await this.findAll({
    where: {
      template: true,
      ativo: true
    },
    order: [['categoria', 'ASC'], ['nome', 'ASC']]
  });
};

Workflow.buscarPorTrigger = async function(eventoTrigger, dadosEvento = {}) {
  const workflows = await this.findAll({
    where: {
      trigger_evento: eventoTrigger,
      ativo: true
    }
  });
  
  // Filtrar workflows que atendem às condições do trigger
  const workflowsValidos = [];
  
  for (const workflow of workflows) {
    if (workflow.avaliarCondicoesTrigger(dadosEvento)) {
      workflowsValidos.push(workflow);
    }
  }
  
  return workflowsValidos;
};

Workflow.prototype.avaliarCondicoesTrigger = function(dadosEvento) {
  if (!this.condicoes_trigger || this.condicoes_trigger.length === 0) {
    return true;
  }
  
  return this.avaliarCondicoes(this.condicoes_trigger, dadosEvento, null).valido;
};

// Templates padrão de workflows
Workflow.criarTemplatesPadrao = async function() {
  const templates = [
    {
      nome: 'Aprovação de Ordem de Serviço',
      descricao: 'Workflow para aprovação de ordens de serviço baseado em valor',
      tipo: 'aprovacao_ordem_servico',
      categoria: 'operacional',
      trigger_evento: 'criacao_ordem',
      user_id: 1,
      template: true,
      estado_inicial: 'criada',
      estados_finais: ['aprovada', 'rejeitada'],
      estados: [
        { id: 'criada', nome: 'Criada', descricao: 'Ordem criada aguardando aprovação' },
        { id: 'em_aprovacao', nome: 'Em Aprovação', descricao: 'Em processo de aprovação' },
        { id: 'aprovada', nome: 'Aprovada', descricao: 'Ordem aprovada' },
        { id: 'rejeitada', nome: 'Rejeitada', descricao: 'Ordem rejeitada' }
      ],
      transicoes: [
        {
          de: 'criada',
          para: 'em_aprovacao',
          titulo: 'Enviar para Aprovação',
          condicoes: [{ campo: 'custo_estimado', operador: 'maior_que', valor: 500 }]
        },
        {
          de: 'em_aprovacao',
          para: 'aprovada',
          titulo: 'Aprovar',
          permissoes_necessarias: ['aprovar_ordens']
        },
        {
          de: 'em_aprovacao',
          para: 'rejeitada',
          titulo: 'Rejeitar',
          permissoes_necessarias: ['aprovar_ordens'],
          requer_observacao: true
        }
      ],
      condicoes_trigger: [
        { campo: 'custo_estimado', operador: 'maior_que', valor: 500 }
      ],
      niveis_aprovacao: [
        { nivel: 1, valor_limite: 1000, aprovadores: ['supervisor'] },
        { nivel: 2, valor_limite: 5000, aprovadores: ['gerente'] },
        { nivel: 3, valor_limite: null, aprovadores: ['diretor'] }
      ],
      prazo_maximo: 48,
      publico: true,
      ativo: true
    },
    {
      nome: 'Escalação de Problema Crítico',
      descricao: 'Workflow para escalação automática de problemas críticos',
      tipo: 'escalacao_problema',
      categoria: 'emergencial',
      trigger_evento: 'mudanca_status',
      user_id: 1,
      template: true,
      estado_inicial: 'detectado',
      estados_finais: ['resolvido', 'escalado_nivel_3'],
      estados: [
        { id: 'detectado', nome: 'Problema Detectado', descricao: 'Problema identificado' },
        { id: 'nivel_1', nome: 'Nível 1', descricao: 'Suporte nível 1' },
        { id: 'nivel_2', nome: 'Nível 2', descricao: 'Suporte nível 2' },
        { id: 'nivel_3', nome: 'Nível 3', descricao: 'Suporte especializado' },
        { id: 'resolvido', nome: 'Resolvido', descricao: 'Problema resolvido' }
      ],
      transicoes: [
        { de: 'detectado', para: 'nivel_1', titulo: 'Iniciar Atendimento' },
        { de: 'nivel_1', para: 'nivel_2', titulo: 'Escalar Nível 2' },
        { de: 'nivel_2', para: 'nivel_3', titulo: 'Escalar Nível 3' },
        { de: 'nivel_1', para: 'resolvido', titulo: 'Resolver' },
        { de: 'nivel_2', para: 'resolvido', titulo: 'Resolver' },
        { de: 'nivel_3', para: 'resolvido', titulo: 'Resolver' }
      ],
      escalacao_config: {
        tempo_nivel_1: 2, // 2 horas
        tempo_nivel_2: 4, // 4 horas
        automatica: true
      },
      prazo_maximo: 8,
      publico: true,
      ativo: true
    }
  ];

  for (const template of templates) {
    await this.findOrCreate({
      where: { nome: template.nome, template: true },
      defaults: template
    });
  }
};

module.exports = Workflow;