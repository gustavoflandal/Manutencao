const { Op } = require('sequelize');
const { 
  Workflow, 
  WorkflowInstancia, 
  WorkflowAcao, 
  User, 
  Setor 
} = require('../models');

class WorkflowController {
  // ===== MÉTODOS DE WORKFLOW =====
  
  async listarWorkflows(req, res) {
    try {
      const { 
        tipo, 
        categoria, 
        template, 
        ativo, 
        setor_id, 
        page = 1, 
        limit = 20,
        search 
      } = req.query;
      
      const where = {};
      
      if (tipo) where.tipo = tipo;
      if (categoria) where.categoria = categoria;
      if (template !== undefined) where.template = template === 'true';
      if (ativo !== undefined) where.ativo = ativo === 'true';
      if (setor_id) where.setor_id = setor_id;
      
      if (search) {
        where[Op.or] = [
          { nome: { [Op.like]: `%${search}%` } },
          { descricao: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Workflow.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'criador',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Setor,
            as: 'setor',
            attributes: ['id', 'nome']
          }
        ],
        offset,
        limit: parseInt(limit),
        order: [['nome', 'ASC']]
      });
      
      // Buscar estatísticas básicas para cada workflow
      const workflowsComEstatisticas = await Promise.all(
        rows.map(async (workflow) => {
          const totalInstancias = await WorkflowInstancia.count({
            where: { workflow_id: workflow.id }
          });
          
          const instanciasAtivas = await WorkflowInstancia.count({
            where: { 
              workflow_id: workflow.id,
              status: 'ativo'
            }
          });
          
          return {
            ...workflow.toJSON(),
            estatisticas: {
              total_instancias: totalInstancias,
              instancias_ativas: instanciasAtivas
            }
          };
        })
      );
      
      res.json({
        workflows: workflowsComEstatisticas,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('Erro ao listar workflows:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async obterWorkflow(req, res) {
    try {
      const { id } = req.params;
      
      const workflow = await Workflow.findByPk(id, {
        include: [
          {
            model: User,
            as: 'criador',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Setor,
            as: 'setor',
            attributes: ['id', 'nome']
          }
        ]
      });
      
      if (!workflow) {
        return res.status(404).json({ erro: 'Workflow não encontrado' });
      }
      
      // Buscar estatísticas detalhadas
      const estatisticas = await this.obterEstatisticasWorkflow(id);
      
      res.json({
        workflow: workflow.toJSON(),
        estatisticas
      });
      
    } catch (error) {
      console.error('Erro ao obter workflow:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async criarWorkflow(req, res) {
    try {
      const dadosWorkflow = {
        ...req.body,
        user_id: req.user.id
      };
      
      // Validar dados obrigatórios
      const camposObrigatorios = ['nome', 'tipo', 'categoria', 'trigger_evento', 'estados', 'transicoes', 'estado_inicial', 'estados_finais'];
      
      for (const campo of camposObrigatorios) {
        if (!dadosWorkflow[campo]) {
          return res.status(400).json({ 
            erro: `Campo obrigatório: ${campo}` 
          });
        }
      }
      
      // Validar estrutura dos estados e transições
      const validacaoEstrutura = this.validarEstruturaWorkflow(dadosWorkflow);
      if (!validacaoEstrutura.valido) {
        return res.status(400).json({ 
          erro: 'Estrutura inválida',
          detalhes: validacaoEstrutura.erros 
        });
      }
      
      const workflow = await Workflow.create(dadosWorkflow);
      
      res.status(201).json({
        message: 'Workflow criado com sucesso',
        workflow
      });
      
    } catch (error) {
      console.error('Erro ao criar workflow:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async atualizarWorkflow(req, res) {
    try {
      const { id } = req.params;
      const dadosAtualizacao = req.body;
      
      const workflow = await Workflow.findByPk(id);
      
      if (!workflow) {
        return res.status(404).json({ erro: 'Workflow não encontrado' });
      }
      
      // Verificar permissão
      if (workflow.user_id !== req.user.id && req.user.perfil !== 'admin') {
        return res.status(403).json({ erro: 'Sem permissão para editar este workflow' });
      }
      
      // Validar estrutura se estiver sendo alterada
      if (dadosAtualizacao.estados || dadosAtualizacao.transicoes) {
        const dadosCompletos = {
          ...workflow.toJSON(),
          ...dadosAtualizacao
        };
        
        const validacaoEstrutura = this.validarEstruturaWorkflow(dadosCompletos);
        if (!validacaoEstrutura.valido) {
          return res.status(400).json({ 
            erro: 'Estrutura inválida',
            detalhes: validacaoEstrutura.erros 
          });
        }
      }
      
      // Backup da configuração anterior
      dadosAtualizacao.backup_configuracao = {
        data: new Date(),
        configuracao_anterior: workflow.toJSON(),
        usuario_alteracao: req.user.id
      };
      
      // Incrementar versão se houve mudanças estruturais
      if (dadosAtualizacao.estados || dadosAtualizacao.transicoes) {
        dadosAtualizacao.versao = workflow.versao + 1;
      }
      
      await workflow.update(dadosAtualizacao);
      
      res.json({
        message: 'Workflow atualizado com sucesso',
        workflow
      });
      
    } catch (error) {
      console.error('Erro ao atualizar workflow:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async excluirWorkflow(req, res) {
    try {
      const { id } = req.params;
      
      const workflow = await Workflow.findByPk(id);
      
      if (!workflow) {
        return res.status(404).json({ erro: 'Workflow não encontrado' });
      }
      
      // Verificar permissão
      if (workflow.user_id !== req.user.id && req.user.perfil !== 'admin') {
        return res.status(403).json({ erro: 'Sem permissão para excluir este workflow' });
      }
      
      // Verificar se há instâncias ativas
      const instanciasAtivas = await WorkflowInstancia.count({
        where: {
          workflow_id: id,
          status: 'ativo'
        }
      });
      
      if (instanciasAtivas > 0) {
        return res.status(400).json({ 
          erro: 'Não é possível excluir workflow com instâncias ativas',
          instancias_ativas: instanciasAtivas
        });
      }
      
      await workflow.destroy();
      
      res.json({
        message: 'Workflow excluído com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao excluir workflow:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async duplicarWorkflow(req, res) {
    try {
      const { id } = req.params;
      const { nome } = req.body;
      
      const workflow = await Workflow.findByPk(id);
      
      if (!workflow) {
        return res.status(404).json({ erro: 'Workflow não encontrado' });
      }
      
      const novoWorkflow = await workflow.duplicar(nome, req.user.id);
      
      res.status(201).json({
        message: 'Workflow duplicado com sucesso',
        workflow: novoWorkflow
      });
      
    } catch (error) {
      console.error('Erro ao duplicar workflow:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  // ===== MÉTODOS DE INSTÂNCIAS =====
  
  async listarInstancias(req, res) {
    try {
      const { 
        workflow_id,
        status,
        prioridade,
        user_iniciador_id,
        user_responsavel_id,
        estado_atual,
        vencidas,
        page = 1,
        limit = 20,
        search
      } = req.query;
      
      const where = {};
      
      if (workflow_id) where.workflow_id = workflow_id;
      if (status) where.status = status;
      if (prioridade) where.prioridade = prioridade;
      if (user_iniciador_id) where.user_iniciador_id = user_iniciador_id;
      if (user_responsavel_id) where.user_responsavel_id = user_responsavel_id;
      if (estado_atual) where.estado_atual = estado_atual;
      
      if (vencidas === 'true') {
        where.status = 'ativo';
        where.prazo_limite = {
          [Op.lt]: new Date()
        };
      }
      
      if (search) {
        where[Op.or] = [
          { numero: { [Op.like]: `%${search}%` } },
          { titulo: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const offset = (page - 1) * limit;
      
      const { count, rows } = await WorkflowInstancia.findAndCountAll({
        where,
        include: [
          {
            model: Workflow,
            as: 'workflow',
            attributes: ['id', 'nome', 'tipo', 'categoria']
          },
          {
            model: User,
            as: 'iniciador',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email']
          }
        ],
        offset,
        limit: parseInt(limit),
        order: [['prioridade', 'DESC'], ['created_at', 'DESC']]
      });
      
      res.json({
        instancias: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('Erro ao listar instâncias:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async obterInstancia(req, res) {
    try {
      const { id } = req.params;
      
      const instancia = await WorkflowInstancia.findByPk(id, {
        include: [
          {
            model: Workflow,
            as: 'workflow'
          },
          {
            model: User,
            as: 'iniciador',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: User,
            as: 'aprovador_atual',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: WorkflowAcao,
            as: 'acoes',
            order: [['created_at', 'DESC']]
          }
        ]
      });
      
      if (!instancia) {
        return res.status(404).json({ erro: 'Instância não encontrada' });
      }
      
      // Obter próximos estados possíveis
      const proximosEstados = instancia.workflow.obterProximosEstados(
        instancia.estado_atual,
        req.user,
        instancia.dados_contexto
      );
      
      res.json({
        instancia,
        proximos_estados: proximosEstados
      });
      
    } catch (error) {
      console.error('Erro ao obter instância:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async criarInstancia(req, res) {
    try {
      const { workflow_id, dados_contexto = {}, titulo, origem_tipo, origem_id } = req.body;
      
      const workflow = await Workflow.findByPk(workflow_id);
      
      if (!workflow) {
        return res.status(404).json({ erro: 'Workflow não encontrado' });
      }
      
      if (!workflow.ativo) {
        return res.status(400).json({ erro: 'Workflow não está ativo' });
      }
      
      const dadosIniciais = {
        titulo: titulo || `${workflow.nome} - ${new Date().toLocaleDateString()}`,
        dados_contexto,
        origem_tipo,
        origem_id
      };
      
      const instancia = await workflow.criarInstancia(dadosIniciais, req.user.id);
      
      res.status(201).json({
        message: 'Instância criada com sucesso',
        instancia
      });
      
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async transicionarEstado(req, res) {
    try {
      const { id } = req.params;
      const { proximo_estado, observacoes = '', dados_adicionais = {} } = req.body;
      
      const instancia = await WorkflowInstancia.findByPk(id);
      
      if (!instancia) {
        return res.status(404).json({ erro: 'Instância não encontrada' });
      }
      
      if (instancia.status !== 'ativo') {
        return res.status(400).json({ erro: 'Instância não está ativa' });
      }
      
      await instancia.transicionarEstado(
        proximo_estado,
        req.user.id,
        observacoes,
        dados_adicionais
      );
      
      res.json({
        message: 'Estado transicionado com sucesso',
        instancia
      });
      
    } catch (error) {
      console.error('Erro ao transicionar estado:', error);
      res.status(400).json({ 
        erro: 'Erro na transição',
        detalhes: error.message 
      });
    }
  }
  
  async pausarInstancia(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      
      const instancia = await WorkflowInstancia.findByPk(id);
      
      if (!instancia) {
        return res.status(404).json({ erro: 'Instância não encontrada' });
      }
      
      if (instancia.status !== 'ativo') {
        return res.status(400).json({ erro: 'Instância não está ativa' });
      }
      
      await instancia.pausar(motivo, req.user.id);
      
      res.json({
        message: 'Instância pausada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao pausar instância:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async reativarInstancia(req, res) {
    try {
      const { id } = req.params;
      
      const instancia = await WorkflowInstancia.findByPk(id);
      
      if (!instancia) {
        return res.status(404).json({ erro: 'Instância não encontrada' });
      }
      
      if (instancia.status !== 'pausado') {
        return res.status(400).json({ erro: 'Instância não está pausada' });
      }
      
      await instancia.reativar(req.user.id);
      
      res.json({
        message: 'Instância reativada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao reativar instância:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async adicionarComentario(req, res) {
    try {
      const { id } = req.params;
      const { comentario, publico = true } = req.body;
      
      const instancia = await WorkflowInstancia.findByPk(id);
      
      if (!instancia) {
        return res.status(404).json({ erro: 'Instância não encontrada' });
      }
      
      const novoComentario = await instancia.adicionarComentario(
        comentario,
        req.user.id,
        publico
      );
      
      res.json({
        message: 'Comentário adicionado com sucesso',
        comentario: novoComentario
      });
      
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  // ===== MÉTODOS DE ESTATÍSTICAS =====
  
  async obterEstatisticasGerais(req, res) {
    try {
      const { data_inicio, data_fim } = req.query;
      
      const filtros = {};
      if (data_inicio) filtros.data_inicio = new Date(data_inicio);
      if (data_fim) filtros.data_fim = new Date(data_fim);
      
      const [estatisticasInstancias, estatisticasAcoes] = await Promise.all([
        WorkflowInstancia.estatisticas(filtros),
        WorkflowAcao.estatisticas(filtros)
      ]);
      
      // Estatísticas de workflows
      const totalWorkflows = await Workflow.count({ where: { ativo: true } });
      const workflowsPorTipo = await Workflow.findAll({
        attributes: ['tipo', [Workflow.sequelize.fn('COUNT', '*'), 'count']],
        where: { ativo: true },
        group: ['tipo'],
        raw: true
      });
      
      res.json({
        instancias: estatisticasInstancias,
        acoes: estatisticasAcoes,
        workflows: {
          total: totalWorkflows,
          por_tipo: workflowsPorTipo
        }
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas gerais:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async obterEstatisticasWorkflow(workflowId) {
    try {
      const [totalInstancias, instanciasAtivas, instanciasConcluidas, tempoMedioExecucao] = await Promise.all([
        WorkflowInstancia.count({ where: { workflow_id: workflowId } }),
        WorkflowInstancia.count({ where: { workflow_id: workflowId, status: 'ativo' } }),
        WorkflowInstancia.count({ where: { workflow_id: workflowId, status: 'concluido' } }),
        WorkflowInstancia.findAll({
          attributes: [[WorkflowInstancia.sequelize.fn('AVG', WorkflowInstancia.sequelize.col('tempo_execucao')), 'tempo_medio']],
          where: { 
            workflow_id: workflowId, 
            tempo_execucao: { [Op.not]: null }
          },
          raw: true
        })
      ]);
      
      return {
        total_instancias: totalInstancias,
        instancias_ativas: instanciasAtivas,
        instancias_concluidas: instanciasConcluidas,
        tempo_medio_execucao: tempoMedioExecucao[0]?.tempo_medio || 0,
        taxa_conclusao: totalInstancias > 0 ? Math.round((instanciasConcluidas / totalInstancias) * 100) : 0
      };
      
    } catch (error) {
      console.error('Erro ao obter estatísticas do workflow:', error);
      return null;
    }
  }
  
  // ===== MÉTODOS DE TEMPLATES =====
  
  async listarTemplates(req, res) {
    try {
      const templates = await Workflow.getTemplates();
      
      res.json({
        templates
      });
      
    } catch (error) {
      console.error('Erro ao listar templates:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async criarTemplatesPadrao(req, res) {
    try {
      await Workflow.criarTemplatesPadrao();
      
      res.json({
        message: 'Templates padrão criados com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao criar templates padrão:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  // ===== MÉTODOS AUXILIARES =====
  
  validarEstruturaWorkflow(dadosWorkflow) {
    const erros = [];
    
    // Validar estados
    if (!Array.isArray(dadosWorkflow.estados) || dadosWorkflow.estados.length === 0) {
      erros.push('Estados deve ser um array não vazio');
    } else {
      const idsEstados = dadosWorkflow.estados.map(e => e.id);
      if (new Set(idsEstados).size !== idsEstados.length) {
        erros.push('IDs de estados devem ser únicos');
      }
    }
    
    // Validar transições
    if (!Array.isArray(dadosWorkflow.transicoes) || dadosWorkflow.transicoes.length === 0) {
      erros.push('Transições deve ser um array não vazio');
    } else {
      const idsEstados = dadosWorkflow.estados.map(e => e.id);
      for (const transicao of dadosWorkflow.transicoes) {
        if (!idsEstados.includes(transicao.de)) {
          erros.push(`Estado de origem '${transicao.de}' não existe`);
        }
        if (!idsEstados.includes(transicao.para)) {
          erros.push(`Estado de destino '${transicao.para}' não existe`);
        }
      }
    }
    
    // Validar estado inicial
    const idsEstados = dadosWorkflow.estados.map(e => e.id);
    if (!idsEstados.includes(dadosWorkflow.estado_inicial)) {
      erros.push('Estado inicial não existe nos estados definidos');
    }
    
    // Validar estados finais
    if (!Array.isArray(dadosWorkflow.estados_finais) || dadosWorkflow.estados_finais.length === 0) {
      erros.push('Estados finais deve ser um array não vazio');
    } else {
      for (const estadoFinal of dadosWorkflow.estados_finais) {
        if (!idsEstados.includes(estadoFinal)) {
          erros.push(`Estado final '${estadoFinal}' não existe nos estados definidos`);
        }
      }
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  }
  
  // ===== MÉTODOS DE AUTOMAÇÃO =====
  
  async executarAcoesAutomaticas(req, res) {
    try {
      const resultados = await WorkflowAcao.executarAcoesAutomaticas();
      
      res.json({
        message: 'Ações automáticas executadas',
        resultados
      });
      
    } catch (error) {
      console.error('Erro ao executar ações automáticas:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
  
  async verificarWorkflowsVencidos(req, res) {
    try {
      const instanciasVencidas = await WorkflowInstancia.getInstanciasVencidas();
      
      // Processar escalações automáticas
      for (const instancia of instanciasVencidas) {
        try {
          await instancia.escalarAutomaticamente();
        } catch (error) {
          console.error(`Erro ao escalar instância ${instancia.id}:`, error);
        }
      }
      
      res.json({
        message: 'Verificação de workflows vencidos concluída',
        instancias_vencidas: instanciasVencidas.length
      });
      
    } catch (error) {
      console.error('Erro ao verificar workflows vencidos:', error);
      res.status(500).json({ 
        erro: 'Erro interno do servidor',
        detalhes: error.message 
      });
    }
  }
}

module.exports = new WorkflowController();
