const Workflow = require('../models/Workflow');
const WorkflowInstancia = require('../models/WorkflowInstancia');
const WorkflowAcao = require('../models/WorkflowAcao');
const User = require('../models/User');

class WorkflowService {
  /**
   * Motor de execução de workflows
   * Processa triggers automáticos e executa workflows
   */
  async processarTriggers(eventoTrigger, dadosEvento = {}) {
    try {
      // Buscar workflows que respondem ao trigger
      const workflows = await Workflow.buscarPorTrigger(eventoTrigger, dadosEvento);
      
      const instanciasCriadas = [];
      
      for (const workflow of workflows) {
        try {
          // Verificar se já existe uma instância ativa para os mesmos dados
          const instanciaExistente = await this.verificarInstanciaExistente(workflow, dadosEvento);
          
          if (!instanciaExistente) {
            // Criar nova instância do workflow
            const instancia = await workflow.criarInstancia(
              dadosEvento,
              dadosEvento.user_id || 1 // Usuário do sistema por padrão
            );
            
            instanciasCriadas.push(instancia);
            
            // Processar ações automáticas iniciais
            await this.processarAcoesIniciais(instancia);
            
            console.log(`Workflow ${workflow.nome} disparado automaticamente`);
          }
        } catch (error) {
          console.error(`Erro ao processar workflow ${workflow.id}:`, error);
        }
      }
      
      return instanciasCriadas;
      
    } catch (error) {
      console.error('Erro ao processar triggers:', error);
      throw error;
    }
  }
  
  /**
   * Verificar se já existe instância ativa para os mesmos dados
   */
  async verificarInstanciaExistente(workflow, dadosEvento) {
    // Verificar baseado na origem se fornecida
    if (dadosEvento.origem_tipo && dadosEvento.origem_id) {
      return await WorkflowInstancia.findOne({
        where: {
          workflow_id: workflow.id,
          origem_tipo: dadosEvento.origem_tipo,
          origem_id: dadosEvento.origem_id,
          status: 'ativo'
        }
      });
    }
    
    return null;
  }
  
  /**
   * Processar ações automáticas iniciais de um workflow
   */
  async processarAcoesIniciais(instancia) {
    try {
      const workflow = await Workflow.findByPk(instancia.workflow_id);
      
      // Buscar estado inicial
      const estadoInicial = workflow.estados.find(e => e.id === workflow.estado_inicial);
      
      if (estadoInicial && estadoInicial.acoes_automaticas) {
        for (const acaoConfig of estadoInicial.acoes_automaticas) {
          await WorkflowAcao.create({
            instancia_id: instancia.id,
            tipo: acaoConfig.tipo,
            configuracao: acaoConfig.configuracao || {},
            user_id: instancia.user_iniciador_id,
            automatica: true,
            status: 'pendente'
          });
        }
      }
      
      // Executar ações pendentes
      await this.executarAcoesPendentes(instancia.id);
      
    } catch (error) {
      console.error('Erro ao processar ações iniciais:', error);
    }
  }
  
  /**
   * Executar ações pendentes de uma instância
   */
  async executarAcoesPendentes(instanciaId) {
    try {
      const acoesPendentes = await WorkflowAcao.findAll({
        where: {
          instancia_id: instanciaId,
          status: 'pendente',
          automatica: true
        },
        order: [['prioridade', 'DESC'], ['created_at', 'ASC']]
      });
      
      for (const acao of acoesPendentes) {
        try {
          await acao.executar();
        } catch (error) {
          console.error(`Erro ao executar ação ${acao.id}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Erro ao executar ações pendentes:', error);
    }
  }
  
  /**
   * Motor de escalação automática
   * Verifica workflows vencidos e executa escalações
   */
  async processarEscalacoes() {
    try {
      const instanciasVencidas = await WorkflowInstancia.getInstanciasVencidas();
      
      const escalacoes = [];
      
      for (const instancia of instanciasVencidas) {
        try {
          const workflow = await Workflow.findByPk(instancia.workflow_id);
          
          if (workflow.escalacao_config && workflow.escalacao_config.automatica) {
            // Verificar se já passou tempo suficiente desde última escalação
            const tempoEscalacao = workflow.escalacao_config.tempo_escalacao || 24; // horas
            const ultimaEscalacao = instancia.data_ultima_escalacao || instancia.created_at;
            const agora = new Date();
            const horasDesdeUltimaEscalacao = (agora - ultimaEscalacao) / (1000 * 60 * 60);
            
            if (horasDesdeUltimaEscalacao >= tempoEscalacao) {
              await instancia.escalarAutomaticamente();
              escalacoes.push({
                instancia_id: instancia.id,
                nivel_anterior: instancia.nivel_aprovacao_atual - 1,
                nivel_atual: instancia.nivel_aprovacao_atual
              });
            }
          }
        } catch (error) {
          console.error(`Erro ao escalar instância ${instancia.id}:`, error);
        }
      }
      
      return escalacoes;
      
    } catch (error) {
      console.error('Erro ao processar escalações:', error);
      throw error;
    }
  }
  
  /**
   * Processar workflows agendados
   */
  async processarWorkflowsAgendados() {
    try {
      const acoesAgendadas = await WorkflowAcao.getAcoesAgendadas();
      
      const execucoes = [];
      
      for (const acao of acoesAgendadas) {
        try {
          const resultado = await acao.executar();
          execucoes.push({
            acao_id: acao.id,
            sucesso: true,
            resultado
          });
        } catch (error) {
          execucoes.push({
            acao_id: acao.id,
            sucesso: false,
            erro: error.message
          });
        }
      }
      
      return execucoes;
      
    } catch (error) {
      console.error('Erro ao processar workflows agendados:', error);
      throw error;
    }
  }
  
  /**
   * Validador de integridade de workflows
   */
  async validarIntegridadeWorkflow(workflowId) {
    try {
      const workflow = await Workflow.findByPk(workflowId);
      
      if (!workflow) {
        throw new Error('Workflow não encontrado');
      }
      
      const problemas = [];
      
      // Validar estados
      if (!workflow.estados || workflow.estados.length === 0) {
        problemas.push('Workflow não possui estados definidos');
      }
      
      // Validar transições
      if (!workflow.transicoes || workflow.transicoes.length === 0) {
        problemas.push('Workflow não possui transições definidas');
      }
      
      // Validar estado inicial
      const idsEstados = workflow.estados.map(e => e.id);
      if (!idsEstados.includes(workflow.estado_inicial)) {
        problemas.push('Estado inicial não existe nos estados definidos');
      }
      
      // Validar estados finais
      for (const estadoFinal of workflow.estados_finais) {
        if (!idsEstados.includes(estadoFinal)) {
          problemas.push(`Estado final '${estadoFinal}' não existe nos estados definidos`);
        }
      }
      
      // Validar conectividade - verificar se todos os estados são alcançáveis
      const estadosAlcancaveis = this.calcularEstadosAlcancaveis(workflow);
      const estadosOrfaos = idsEstados.filter(id => !estadosAlcancaveis.includes(id));
      
      if (estadosOrfaos.length > 0) {
        problemas.push(`Estados órfãos (não alcançáveis): ${estadosOrfaos.join(', ')}`);
      }
      
      // Validar se existe caminho para estados finais
      const podeChegar = this.verificarCaminhoParaEstadosFinais(workflow);
      if (!podeChegar) {
        problemas.push('Não há caminho do estado inicial para os estados finais');
      }
      
      return {
        valido: problemas.length === 0,
        problemas
      };
      
    } catch (error) {
      console.error('Erro ao validar integridade do workflow:', error);
      throw error;
    }
  }
  
  /**
   * Calcular estados alcançáveis a partir do estado inicial
   */
  calcularEstadosAlcancaveis(workflow) {
    const alcancaveis = new Set([workflow.estado_inicial]);
    const paraProcessar = [workflow.estado_inicial];
    
    while (paraProcessar.length > 0) {
      const estadoAtual = paraProcessar.shift();
      
      // Encontrar transições a partir do estado atual
      const transicoes = workflow.transicoes.filter(t => t.de === estadoAtual);
      
      for (const transicao of transicoes) {
        if (!alcancaveis.has(transicao.para)) {
          alcancaveis.add(transicao.para);
          paraProcessar.push(transicao.para);
        }
      }
    }
    
    return Array.from(alcancaveis);
  }
  
  /**
   * Verificar se existe caminho do estado inicial para estados finais
   */
  verificarCaminhoParaEstadosFinais(workflow) {
    const estadosAlcancaveis = this.calcularEstadosAlcancaveis(workflow);
    
    // Verificar se pelo menos um estado final é alcançável
    return workflow.estados_finais.some(estadoFinal => 
      estadosAlcancaveis.includes(estadoFinal)
    );
  }
  
  /**
   * Otimizador de performance de workflows
   */
  async analisarPerformanceWorkflow(workflowId, periodo = 30) {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - periodo);
      
      const instancias = await WorkflowInstancia.findAll({
        where: {
          workflow_id: workflowId,
          created_at: {
            [require('sequelize').Op.gte]: dataInicio
          }
        },
        include: ['workflow']
      });
      
      if (instancias.length === 0) {
        return {
          total_instancias: 0,
          recomendacoes: ['Não há dados suficientes para análise']
        };
      }
      
      // Calcular métricas
      const temposExecucao = instancias
        .filter(i => i.tempo_execucao)
        .map(i => i.tempo_execucao);
      
      const tempoMedio = temposExecucao.length > 0 
        ? temposExecucao.reduce((a, b) => a + b, 0) / temposExecucao.length 
        : 0;
      
      const tempoMaximo = temposExecucao.length > 0 ? Math.max(...temposExecucao) : 0;
      const tempoMinimo = temposExecucao.length > 0 ? Math.min(...temposExecucao) : 0;
      
      // Analisar gargalos por estado
      const temposPorEstado = this.calcularTemposPorEstado(instancias);
      const estadosLentos = Object.entries(temposPorEstado)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      // Gerar recomendações
      const recomendacoes = [];
      
      if (tempoMedio > 1440) { // > 24 horas
        recomendacoes.push('Tempo médio muito alto - considere simplificar o workflow');
      }
      
      if (estadosLentos.length > 0 && estadosLentos[0][1] > 720) { // > 12 horas
        recomendacoes.push(`Estado '${estadosLentos[0][0]}' é um gargalo - considere automação`);
      }
      
      const taxaConclusao = instancias.filter(i => i.status === 'concluido').length / instancias.length * 100;
      if (taxaConclusao < 80) {
        recomendacoes.push('Taxa de conclusão baixa - revisar pontos de falha');
      }
      
      const instanciasVencidas = instancias.filter(i => 
        i.prazo_limite && i.data_conclusao && i.data_conclusao > i.prazo_limite
      ).length;
      
      if (instanciasVencidas / instancias.length > 0.2) {
        recomendacoes.push('Muitas instâncias vencendo prazo - ajustar prazos ou processo');
      }
      
      return {
        total_instancias: instancias.length,
        tempo_medio: Math.round(tempoMedio),
        tempo_maximo: tempoMaximo,
        tempo_minimo: tempoMinimo,
        taxa_conclusao: Math.round(taxaConclusao),
        estados_lentos: estadosLentos,
        recomendacoes
      };
      
    } catch (error) {
      console.error('Erro ao analisar performance do workflow:', error);
      throw error;
    }
  }
  
  /**
   * Calcular tempo médio por estado baseado no histórico das instâncias
   */
  calcularTemposPorEstado(instancias) {
    const temposPorEstado = {};
    
    for (const instancia of instancias) {
      if (!instancia.historico_estados || instancia.historico_estados.length < 2) continue;
      
      for (let i = 0; i < instancia.historico_estados.length - 1; i++) {
        const estadoAtual = instancia.historico_estados[i];
        const proximoEstado = instancia.historico_estados[i + 1];
        
        const tempoNoEstado = new Date(proximoEstado.data) - new Date(estadoAtual.data);
        const tempoMinutos = tempoNoEstado / (1000 * 60);
        
        const nomeEstado = estadoAtual.estado_novo || estadoAtual.estado;
        
        if (!temposPorEstado[nomeEstado]) {
          temposPorEstado[nomeEstado] = [];
        }
        
        temposPorEstado[nomeEstado].push(tempoMinutos);
      }
    }
    
    // Calcular médias
    const mediasEstados = {};
    for (const [estado, tempos] of Object.entries(temposPorEstado)) {
      mediasEstados[estado] = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    }
    
    return mediasEstados;
  }
  
  /**
   * Gerador de relatórios de workflow
   */
  async gerarRelatorioWorkflow(workflowId, periodo = 30, formato = 'json') {
    try {
      const workflow = await Workflow.findByPk(workflowId);
      
      if (!workflow) {
        throw new Error('Workflow não encontrado');
      }
      
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - periodo);
      
      // Buscar dados das instâncias
      const instancias = await WorkflowInstancia.findAll({
        where: {
          workflow_id: workflowId,
          created_at: {
            [require('sequelize').Op.gte]: dataInicio
          }
        },
        include: ['iniciador', 'responsavel'],
        order: [['created_at', 'DESC']]
      });
      
      // Buscar ações executadas
      const acoes = await WorkflowAcao.findAll({
        include: [{
          model: WorkflowInstancia,
          as: 'instancia',
          where: { workflow_id: workflowId }
        }]
      });
      
      // Calcular estatísticas
      const estatisticas = {
        total_instancias: instancias.length,
        instancias_concluidas: instancias.filter(i => i.status === 'concluido').length,
        instancias_ativas: instancias.filter(i => i.status === 'ativo').length,
        instancias_pausadas: instancias.filter(i => i.status === 'pausado').length,
        instancias_canceladas: instancias.filter(i => i.status === 'cancelado').length,
        tempo_medio_execucao: this.calcularTempoMedioExecucao(instancias),
        taxa_conclusao: instancias.length > 0 
          ? Math.round((instancias.filter(i => i.status === 'concluido').length / instancias.length) * 100) 
          : 0
      };
      
      // Análise por usuário
      const usuarioStats = this.analisarPorUsuario(instancias);
      
      // Análise por estado
      const estadoStats = this.analisarPorEstado(instancias);
      
      const relatorio = {
        workflow: {
          id: workflow.id,
          nome: workflow.nome,
          tipo: workflow.tipo,
          categoria: workflow.categoria
        },
        periodo: {
          data_inicio: dataInicio,
          data_fim: new Date(),
          dias: periodo
        },
        estatisticas,
        analise_usuarios: usuarioStats,
        analise_estados: estadoStats,
        instancias_recentes: instancias.slice(0, 10).map(i => ({
          id: i.id,
          numero: i.numero,
          titulo: i.titulo,
          status: i.status,
          estado_atual: i.estado_atual,
          iniciador: i.iniciador?.name,
          responsavel: i.responsavel?.name,
          created_at: i.created_at
        })),
        data_geracao: new Date()
      };
      
      if (formato === 'csv') {
        return this.converterParaCSV(relatorio);
      }
      
      return relatorio;
      
    } catch (error) {
      console.error('Erro ao gerar relatório do workflow:', error);
      throw error;
    }
  }
  
  calcularTempoMedioExecucao(instancias) {
    const tempos = instancias
      .filter(i => i.tempo_execucao)
      .map(i => i.tempo_execucao);
    
    return tempos.length > 0 
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
      : 0;
  }
  
  analisarPorUsuario(instancias) {
    const stats = {};
    
    for (const instancia of instancias) {
      const iniciador = instancia.iniciador?.name || 'Desconhecido';
      const responsavel = instancia.responsavel?.name || 'Desconhecido';
      
      if (!stats[iniciador]) {
        stats[iniciador] = { iniciadas: 0, como_iniciador: true };
      }
      stats[iniciador].iniciadas++;
      
      if (!stats[responsavel]) {
        stats[responsavel] = { responsaveis: 0, como_responsavel: true };
      }
      stats[responsavel].responsaveis = (stats[responsavel].responsaveis || 0) + 1;
    }
    
    return stats;
  }
  
  analisarPorEstado(instancias) {
    const stats = {};
    
    for (const instancia of instancias) {
      const estado = instancia.estado_atual;
      
      if (!stats[estado]) {
        stats[estado] = 0;
      }
      stats[estado]++;
    }
    
    return stats;
  }
  
  converterParaCSV(relatorio) {
    // Implementação básica de conversão para CSV
    const linhas = [
      'Relatório de Workflow',
      `Workflow: ${relatorio.workflow.nome}`,
      `Período: ${relatorio.periodo.data_inicio.toLocaleDateString()} - ${relatorio.periodo.data_fim.toLocaleDateString()}`,
      '',
      'Estatísticas:',
      `Total de Instâncias: ${relatorio.estatisticas.total_instancias}`,
      `Concluídas: ${relatorio.estatisticas.instancias_concluidas}`,
      `Ativas: ${relatorio.estatisticas.instancias_ativas}`,
      `Taxa de Conclusão: ${relatorio.estatisticas.taxa_conclusao}%`,
      `Tempo Médio: ${relatorio.estatisticas.tempo_medio_execucao} minutos`,
      ''
    ];
    
    return linhas.join('\n');
  }
  
  /**
   * Limpeza automática de dados antigos
   */
  async limparDadosAntigos(diasRetencao = 365) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasRetencao);
      
      // Buscar instâncias antigas concluídas
      const instanciasAntigas = await WorkflowInstancia.findAll({
        where: {
          status: {
            [require('sequelize').Op.in]: ['concluido', 'cancelado']
          },
          data_conclusao: {
            [require('sequelize').Op.lt]: dataLimite
          }
        }
      });
      
      let totalLimpas = 0;
      
      for (const instancia of instanciasAntigas) {
        // Fazer backup antes de excluir (opcional)
        const backup = {
          instancia_id: instancia.id,
          dados: instancia.toJSON(),
          data_backup: new Date()
        };
        
        // Aqui poderia salvar o backup em um sistema de arquivos ou storage
        console.log('Backup criado para instância:', instancia.id);
        
        // Excluir ações relacionadas
        await WorkflowAcao.destroy({
          where: { instancia_id: instancia.id }
        });
        
        // Excluir instância
        await instancia.destroy();
        
        totalLimpas++;
      }
      
      return {
        instancias_limpas: totalLimpas,
        data_limite: dataLimite
      };
      
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      throw error;
    }
  }
}

module.exports = new WorkflowService();