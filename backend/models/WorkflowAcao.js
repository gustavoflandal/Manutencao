const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkflowAcao = sequelize.define('WorkflowAcao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  instancia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'workflow_instancias',
      key: 'id'
    },
    comment: 'ID da instância do workflow'
  },
  tipo: {
    type: DataTypes.ENUM(
      'enviar_notificacao',
      'atualizar_origem',
      'definir_responsavel',
      'definir_prazo',
      'escalar_automaticamente',
      'executar_script',
      'integrar_sistema',
      'gerar_documento',
      'agendar_tarefa',
      'validar_dados',
      'calcular_metrica',
      'backup_dados'
    ),
    allowNull: false,
    comment: 'Tipo da ação executada'
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nome descritivo da ação'
  },
  configuracao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuração específica da ação'
  },
  status: {
    type: DataTypes.ENUM(
      'pendente',
      'executando',
      'executada',
      'erro',
      'cancelada',
      'agendada'
    ),
    defaultValue: 'pendente',
    comment: 'Status da execução da ação'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Usuário que disparou a ação'
  },
  data_agendamento: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data agendada para execução'
  },
  data_execucao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de execução da ação'
  },
  duracao_execucao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duração da execução em milissegundos'
  },
  resultado: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Resultado da execução da ação'
  },
  erro: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mensagem de erro se houver'
  },
  tentativas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Número de tentativas de execução'
  },
  max_tentativas: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    comment: 'Número máximo de tentativas'
  },
  prioridade: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: 'Prioridade da ação (1-10)'
  },
  dependencias: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'IDs de ações que devem ser executadas antes'
  },
  contexto_execucao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Contexto adicional para execução'
  },
  automatica: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se a ação é executada automaticamente'
  },
  reversivel: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se a ação pode ser revertida'
  },
  dados_reversao: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Dados necessários para reverter a ação'
  }
}, {
  tableName: 'workflow_acoes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_workflow_acoes_instancia',
      fields: ['instancia_id']
    },
    {
      name: 'idx_workflow_acoes_tipo',
      fields: ['tipo']
    },
    {
      name: 'idx_workflow_acoes_status',
      fields: ['status']
    },
    {
      name: 'idx_workflow_acoes_usuario',
      fields: ['user_id']
    },
    {
      name: 'idx_workflow_acoes_agendamento',
      fields: ['data_agendamento', 'status']
    },
    {
      name: 'idx_workflow_acoes_prioridade',
      fields: ['prioridade', 'status']
    },
    {
      name: 'idx_workflow_acoes_automatica',
      fields: ['automatica', 'status']
    }
  ]
});

// Associações
WorkflowAcao.associate = (models) => {
  // Relacionamento com Instância do Workflow
  WorkflowAcao.belongsTo(models.WorkflowInstancia, {
    foreignKey: 'instancia_id',
    as: 'instancia'
  });

  // Relacionamento com Usuário
  WorkflowAcao.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'usuario'
  });
};

// Métodos de instância
WorkflowAcao.prototype.executar = async function() {
  if (this.status !== 'pendente' && this.status !== 'agendada') {
    throw new Error(`Ação não pode ser executada no status: ${this.status}`);
  }
  
  // Verificar dependências
  if (this.dependencias && this.dependencias.length > 0) {
    const dependenciasNaoConcluidas = await WorkflowAcao.findAll({
      where: {
        id: this.dependencias,
        status: {
          [require('sequelize').Op.notIn]: ['executada', 'cancelada']
        }
      }
    });
    
    if (dependenciasNaoConcluidas.length > 0) {
      throw new Error('Existem dependências não concluídas');
    }
  }
  
  const inicioExecucao = Date.now();
  
  try {
    await this.update({
      status: 'executando',
      data_execucao: new Date(),
      tentativas: this.tentativas + 1
    });
    
    let resultado;
    
    switch (this.tipo) {
      case 'enviar_notificacao':
        resultado = await this.executarNotificacao();
        break;
      case 'atualizar_origem':
        resultado = await this.executarAtualizacaoOrigem();
        break;
      case 'definir_responsavel':
        resultado = await this.executarDefinirResponsavel();
        break;
      case 'definir_prazo':
        resultado = await this.executarDefinirPrazo();
        break;
      case 'escalar_automaticamente':
        resultado = await this.executarEscalacao();
        break;
      case 'executar_script':
        resultado = await this.executarScript();
        break;
      case 'integrar_sistema':
        resultado = await this.executarIntegracao();
        break;
      case 'gerar_documento':
        resultado = await this.executarGeracaoDocumento();
        break;
      case 'agendar_tarefa':
        resultado = await this.executarAgendamento();
        break;
      case 'validar_dados':
        resultado = await this.executarValidacao();
        break;
      case 'calcular_metrica':
        resultado = await this.executarCalculoMetrica();
        break;
      case 'backup_dados':
        resultado = await this.executarBackup();
        break;
      default:
        throw new Error(`Tipo de ação não suportado: ${this.tipo}`);
    }
    
    const duracaoExecucao = Date.now() - inicioExecucao;
    
    await this.update({
      status: 'executada',
      resultado: resultado,
      duracao_execucao: duracaoExecucao
    });
    
    return resultado;
    
  } catch (error) {
    const duracaoExecucao = Date.now() - inicioExecucao;
    
    await this.update({
      status: 'erro',
      erro: error.message,
      duracao_execucao: duracaoExecucao
    });
    
    // Verificar se deve tentar novamente
    if (this.tentativas < this.max_tentativas && this.automatica) {
      // Reagendar para nova tentativa (com backoff exponencial)
      const proximaTentativa = new Date();
      proximaTentativa.setMinutes(proximaTentativa.getMinutes() + Math.pow(2, this.tentativas));
      
      await this.update({
        status: 'agendada',
        data_agendamento: proximaTentativa
      });
    }
    
    throw error;
  }
};

WorkflowAcao.prototype.executarNotificacao = async function() {
  const config = this.configuracao;
  const instancia = await this.getInstancia({ include: ['workflow', 'iniciador', 'responsavel'] });
  
  // Preparar dados da notificação
  const dadosNotificacao = {
    destinatarios: config.destinatarios || [instancia.user_responsavel_id],
    titulo: this.processarTemplate(config.titulo, instancia),
    mensagem: this.processarTemplate(config.mensagem, instancia),
    tipo: config.tipo || 'workflow',
    prioridade: config.prioridade || instancia.prioridade,
    dados_extras: {
      instancia_id: instancia.id,
      workflow_id: instancia.workflow_id,
      numero: instancia.numero,
      estado_atual: instancia.estado_atual
    }
  };
  
  // Aqui integraria com o sistema de notificações real
  console.log('Enviando notificação:', dadosNotificacao);
  
  return {
    notificacao_enviada: true,
    destinatarios: dadosNotificacao.destinatarios,
    titulo: dadosNotificacao.titulo
  };
};

WorkflowAcao.prototype.executarAtualizacaoOrigem = async function() {
  const config = this.configuracao;
  const instancia = await this.getInstancia();
  
  if (!instancia.origem_tipo || !instancia.origem_id) {
    throw new Error('Instância não possui origem definida');
  }
  
  // Lógica para atualizar o registro de origem
  const camposAtualizacao = config.campos || {};
  
  // Aqui seria implementada a atualização baseada no tipo de origem
  switch (instancia.origem_tipo) {
    case 'ordem_servico':
      // Atualizar ordem de serviço
      break;
    case 'solicitacao':
      // Atualizar solicitação
      break;
    // Adicionar outros tipos
  }
  
  return {
    origem_atualizada: true,
    tipo: instancia.origem_tipo,
    id: instancia.origem_id,
    campos: camposAtualizacao
  };
};

WorkflowAcao.prototype.executarDefinirResponsavel = async function() {
  const config = this.configuracao;
  const instancia = await this.getInstancia();
  
  const novoResponsavelId = config.user_id || config.responsavel_id;
  
  if (!novoResponsavelId) {
    throw new Error('ID do responsável não especificado');
  }
  
  await instancia.update({
    user_responsavel_id: novoResponsavelId
  });
  
  return {
    responsavel_definido: true,
    novo_responsavel_id: novoResponsavelId
  };
};

WorkflowAcao.prototype.executarDefinirPrazo = async function() {
  const config = this.configuracao;
  const instancia = await this.getInstancia();
  
  const horas = config.horas || config.prazo_horas;
  
  if (!horas) {
    throw new Error('Prazo em horas não especificado');
  }
  
  const novoPrazo = new Date();
  novoPrazo.setHours(novoPrazo.getHours() + horas);
  
  await instancia.update({
    prazo_limite: novoPrazo
  });
  
  return {
    prazo_definido: true,
    novo_prazo: novoPrazo,
    horas_adicionadas: horas
  };
};

WorkflowAcao.prototype.executarEscalacao = async function() {
  const instancia = await this.getInstancia({ include: ['workflow'] });
  const workflow = instancia.workflow;
  
  if (!workflow.escalacao_config || !workflow.escalacao_config.automatica) {
    throw new Error('Escalação automática não configurada');
  }
  
  const proximoNivel = (instancia.nivel_aprovacao_atual || 0) + 1;
  const configEscalacao = workflow.niveis_aprovacao?.find(n => n.nivel === proximoNivel);
  
  if (!configEscalacao) {
    throw new Error('Não há próximo nível de escalação');
  }
  
  await instancia.update({
    nivel_aprovacao_atual: proximoNivel,
    escalacao_count: instancia.escalacao_count + 1,
    data_ultima_escalacao: new Date()
  });
  
  return {
    escalacao_executada: true,
    nivel_anterior: proximoNivel - 1,
    nivel_atual: proximoNivel,
    aprovadores: configEscalacao.aprovadores
  };
};

WorkflowAcao.prototype.executarScript = async function() {
  const config = this.configuracao;
  
  if (!config.script) {
    throw new Error('Script não especificado');
  }
  
  // Aqui seria implementada a execução de scripts
  // Por segurança, seria limitado a scripts pré-aprovados
  
  return {
    script_executado: true,
    script: config.script,
    parametros: config.parametros || {}
  };
};

WorkflowAcao.prototype.executarIntegracao = async function() {
  const config = this.configuracao;
  
  // Implementar integrações com sistemas externos
  // Exemplo: ERP, CRM, APIs externas
  
  return {
    integracao_executada: true,
    sistema: config.sistema,
    operacao: config.operacao
  };
};

WorkflowAcao.prototype.executarGeracaoDocumento = async function() {
  const config = this.configuracao;
  const instancia = await this.getInstancia({ include: ['workflow', 'iniciador'] });
  
  // Gerar documento baseado em template
  const documento = {
    tipo: config.tipo_documento,
    template: config.template,
    dados: {
      instancia: instancia,
      data_geracao: new Date()
    }
  };
  
  return {
    documento_gerado: true,
    tipo: documento.tipo,
    arquivo: `documento_${instancia.numero}_${Date.now()}.pdf`
  };
};

WorkflowAcao.prototype.executarAgendamento = async function() {
  const config = this.configuracao;
  
  // Agendar tarefa futura
  const dataAgendamento = new Date(config.data_agendamento);
  
  return {
    tarefa_agendada: true,
    data_agendamento: dataAgendamento,
    tipo_tarefa: config.tipo_tarefa
  };
};

WorkflowAcao.prototype.executarValidacao = async function() {
  const config = this.configuracao;
  const instancia = await this.getInstancia();
  
  // Validar dados da instância
  const validacoes = config.validacoes || [];
  const resultados = [];
  
  for (const validacao of validacoes) {
    const resultado = this.validarCampo(instancia, validacao);
    resultados.push(resultado);
  }
  
  const todasValidas = resultados.every(r => r.valido);
  
  return {
    validacao_executada: true,
    todas_validas: todasValidas,
    resultados: resultados
  };
};

WorkflowAcao.prototype.validarCampo = function(instancia, validacao) {
  const valor = instancia.dados_contexto[validacao.campo];
  
  switch (validacao.tipo) {
    case 'obrigatorio':
      return {
        campo: validacao.campo,
        valido: valor !== null && valor !== undefined && valor !== '',
        erro: valor ? null : 'Campo obrigatório'
      };
    case 'numero_minimo':
      return {
        campo: validacao.campo,
        valido: parseFloat(valor) >= validacao.valor,
        erro: parseFloat(valor) >= validacao.valor ? null : `Valor deve ser >= ${validacao.valor}`
      };
    // Adicionar outras validações
    default:
      return { campo: validacao.campo, valido: true };
  }
};

WorkflowAcao.prototype.executarCalculoMetrica = async function() {
  const config = this.configuracao;
  const instancia = await this.getInstancia();
  
  // Calcular métrica específica
  const metrica = config.metrica;
  const valor = this.calcularValorMetrica(instancia, metrica);
  
  return {
    metrica_calculada: true,
    metrica: metrica,
    valor: valor
  };
};

WorkflowAcao.prototype.calcularValorMetrica = function(instancia, metrica) {
  switch (metrica.tipo) {
    case 'tempo_execucao':
      return instancia.tempo_execucao;
    case 'numero_transicoes':
      return instancia.historico_estados.length;
    case 'numero_escalacoes':
      return instancia.escalacao_count;
    // Adicionar outros tipos de métricas
    default:
      return 0;
  }
};

WorkflowAcao.prototype.executarBackup = async function() {
  const instancia = await this.getInstancia();
  
  // Criar backup dos dados da instância
  const backup = {
    instancia_id: instancia.id,
    dados_backup: {
      estado_atual: instancia.estado_atual,
      dados_contexto: instancia.dados_contexto,
      historico_estados: instancia.historico_estados
    },
    data_backup: new Date()
  };
  
  return {
    backup_executado: true,
    backup_id: `backup_${instancia.id}_${Date.now()}`
  };
};

WorkflowAcao.prototype.processarTemplate = function(template, instancia) {
  if (!template) return '';
  
  let resultado = template;
  
  // Substituir variáveis no template
  resultado = resultado.replace(/\{numero\}/g, instancia.numero || '');
  resultado = resultado.replace(/\{titulo\}/g, instancia.titulo || '');
  resultado = resultado.replace(/\{estado_atual\}/g, instancia.estado_atual || '');
  resultado = resultado.replace(/\{workflow_nome\}/g, instancia.workflow?.nome || '');
  resultado = resultado.replace(/\{iniciador_nome\}/g, instancia.iniciador?.name || '');
  resultado = resultado.replace(/\{responsavel_nome\}/g, instancia.responsavel?.name || '');
  
  return resultado;
};

WorkflowAcao.prototype.reverter = async function() {
  if (!this.reversivel || !this.dados_reversao) {
    throw new Error('Ação não é reversível');
  }
  
  if (this.status !== 'executada') {
    throw new Error('Ação não foi executada');
  }
  
  // Implementar lógica de reversão baseada no tipo de ação
  // Usar dados_reversao para restaurar estado anterior
  
  await this.update({
    status: 'cancelada',
    resultado: { ...this.resultado, revertida: true, data_reversao: new Date() }
  });
  
  return { acao_revertida: true };
};

// Métodos estáticos
WorkflowAcao.getAcoesPendentes = async function() {
  return await this.findAll({
    where: {
      status: 'pendente'
    },
    order: [['prioridade', 'DESC'], ['created_at', 'ASC']]
  });
};

WorkflowAcao.getAcoesAgendadas = async function() {
  return await this.findAll({
    where: {
      status: 'agendada',
      data_agendamento: {
        [require('sequelize').Op.lte]: new Date()
      }
    },
    order: [['prioridade', 'DESC'], ['data_agendamento', 'ASC']]
  });
};

WorkflowAcao.executarAcoesAutomaticas = async function() {
  const acoesPendentes = await this.getAcoesPendentes();
  const acoesAgendadas = await this.getAcoesAgendadas();
  
  const acoesParaExecutar = [...acoesPendentes, ...acoesAgendadas]
    .filter(acao => acao.automatica)
    .sort((a, b) => b.prioridade - a.prioridade);
  
  const resultados = [];
  
  for (const acao of acoesParaExecutar) {
    try {
      const resultado = await acao.executar();
      resultados.push({ acao_id: acao.id, sucesso: true, resultado });
    } catch (error) {
      resultados.push({ acao_id: acao.id, sucesso: false, erro: error.message });
    }
  }
  
  return resultados;
};

WorkflowAcao.estatisticas = async function(filtros = {}) {
  const where = {};
  
  if (filtros.data_inicio) {
    where.created_at = {
      [require('sequelize').Op.gte]: filtros.data_inicio
    };
  }
  
  if (filtros.data_fim) {
    where.created_at = {
      ...where.created_at,
      [require('sequelize').Op.lte]: filtros.data_fim
    };
  }
  
  const total = await this.count({ where });
  const executadas = await this.count({ where: { ...where, status: 'executada' } });
  const pendentes = await this.count({ where: { ...where, status: 'pendente' } });
  const erros = await this.count({ where: { ...where, status: 'erro' } });
  
  return {
    total,
    executadas,
    pendentes,
    erros,
    taxa_sucesso: total > 0 ? Math.round((executadas / total) * 100) : 0
  };
};

module.exports = WorkflowAcao;