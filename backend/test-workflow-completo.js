const axios = require('axios');
const fs = require('fs');

// Configuração da API
const API_BASE = 'http://localhost:3000/api';
let authToken = '';

class WorkflowTester {
  constructor() {
    this.resultados = {
      total_testes: 0,
      testes_passou: 0,
      testes_falhou: 0,
      detalhes: []
    };
  }
  
  async executarTodosOsTestes() {
    console.log('🚀 Iniciando testes completos do sistema de workflow...\n');
    
    try {
      // 1. Fazer login
      await this.fazerLogin();
      
      // 2. Testar workflows
      await this.testarWorkflows();
      
      // 3. Testar instâncias
      await this.testarInstancias();
      
      // 4. Testar ações
      await this.testarAcoes();
      
      // 5. Testar estatísticas
      await this.testarEstatisticas();
      
      // 6. Testar automação
      await this.testarAutomacao();
      
      // Exibir relatório final
      this.exibirRelatorioFinal();
      
    } catch (error) {
      console.error('❌ Erro nos testes:', error.message);
    }
  }
  
  async fazerLogin() {
    try {
      console.log('🔐 Fazendo login...');
      
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@sistema.com',
        password: 'admin123'
      });
      
      if (response.data.token) {
        authToken = response.data.token;
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        this.registrarTeste('Login', true, 'Login realizado com sucesso');
        console.log('✅ Login realizado com sucesso\n');
      } else {
        throw new Error('Token não recebido');
      }
      
    } catch (error) {
      this.registrarTeste('Login', false, error.message);
      throw error;
    }
  }
  
  async testarWorkflows() {
    console.log('📋 Testando gestão de workflows...');
    
    // Testar listagem de workflows
    await this.testarListagemWorkflows();
    
    // Testar criação de workflow
    const workflowId = await this.testarCriacaoWorkflow();
    
    // Testar obtenção de workflow específico
    await this.testarObterWorkflow(workflowId);
    
    // Testar atualização de workflow
    await this.testarAtualizacaoWorkflow(workflowId);
    
    // Testar duplicação de workflow
    await this.testarDuplicacaoWorkflow(workflowId);
    
    // Testar templates
    await this.testarTemplates();
    
    console.log('✅ Testes de workflows concluídos\n');
  }
  
  async testarListagemWorkflows() {
    try {
      const response = await axios.get(`${API_BASE}/workflows`);
      
      if (response.status === 200 && Array.isArray(response.data.workflows)) {
        this.registrarTeste('Listar Workflows', true, `${response.data.workflows.length} workflows encontrados`);
      } else {
        throw new Error('Resposta inválida');
      }
      
    } catch (error) {
      this.registrarTeste('Listar Workflows', false, error.message);
    }
  }
  
  async testarCriacaoWorkflow() {
    try {
      const novoWorkflow = {
        nome: 'Workflow Teste Automatizado',
        descricao: 'Workflow criado durante os testes automatizados',
        tipo: 'workflow_personalizado',
        categoria: 'tecnico',
        trigger_evento: 'manual',
        estado_inicial: 'inicio',
        estados_finais: ['concluido', 'cancelado'],
        estados: [
          { id: 'inicio', nome: 'Início', descricao: 'Estado inicial' },
          { id: 'em_andamento', nome: 'Em Andamento', descricao: 'Processando' },
          { id: 'concluido', nome: 'Concluído', descricao: 'Finalizado com sucesso' },
          { id: 'cancelado', nome: 'Cancelado', descricao: 'Cancelado pelo usuário' }
        ],
        transicoes: [
          { de: 'inicio', para: 'em_andamento', titulo: 'Iniciar Processamento' },
          { de: 'em_andamento', para: 'concluido', titulo: 'Finalizar' },
          { de: 'em_andamento', para: 'cancelado', titulo: 'Cancelar' }
        ],
        prazo_maximo: 24,
        publico: true
      };
      
      const response = await axios.post(`${API_BASE}/workflows`, novoWorkflow);
      
      if (response.status === 201 && response.data.workflow.id) {
        this.registrarTeste('Criar Workflow', true, `Workflow criado com ID ${response.data.workflow.id}`);
        return response.data.workflow.id;
      } else {
        throw new Error('Workflow não foi criado');
      }
      
    } catch (error) {
      this.registrarTeste('Criar Workflow', false, error.message);
      return null;
    }
  }
  
  async testarObterWorkflow(workflowId) {
    if (!workflowId) return;
    
    try {
      const response = await axios.get(`${API_BASE}/workflows/${workflowId}`);
      
      if (response.status === 200 && response.data.workflow) {
        this.registrarTeste('Obter Workflow', true, `Workflow ${workflowId} obtido com sucesso`);
      } else {
        throw new Error('Workflow não encontrado');
      }
      
    } catch (error) {
      this.registrarTeste('Obter Workflow', false, error.message);
    }
  }
  
  async testarAtualizacaoWorkflow(workflowId) {
    if (!workflowId) return;
    
    try {
      const atualizacao = {
        descricao: 'Workflow atualizado durante os testes'
      };
      
      const response = await axios.put(`${API_BASE}/workflows/${workflowId}`, atualizacao);
      
      if (response.status === 200) {
        this.registrarTeste('Atualizar Workflow', true, `Workflow ${workflowId} atualizado`);
      } else {
        throw new Error('Falha na atualização');
      }
      
    } catch (error) {
      this.registrarTeste('Atualizar Workflow', false, error.message);
    }
  }
  
  async testarDuplicacaoWorkflow(workflowId) {
    if (!workflowId) return;
    
    try {
      const response = await axios.post(`${API_BASE}/workflows/${workflowId}/duplicar`, {
        nome: 'Workflow Duplicado - Teste'
      });
      
      if (response.status === 201 && response.data.workflow.id) {
        this.registrarTeste('Duplicar Workflow', true, `Workflow duplicado com ID ${response.data.workflow.id}`);
      } else {
        throw new Error('Falha na duplicação');
      }
      
    } catch (error) {
      this.registrarTeste('Duplicar Workflow', false, error.message);
    }
  }
  
  async testarTemplates() {
    try {
      const response = await axios.get(`${API_BASE}/workflows/templates`);
      
      if (response.status === 200 && Array.isArray(response.data.templates)) {
        this.registrarTeste('Listar Templates', true, `${response.data.templates.length} templates encontrados`);
      } else {
        throw new Error('Resposta inválida');
      }
      
    } catch (error) {
      this.registrarTeste('Listar Templates', false, error.message);
    }
  }
  
  async testarInstancias() {
    console.log('⚙️ Testando instâncias de workflow...');
    
    // Buscar um workflow para criar instância
    const workflows = await this.obterWorkflowsDisponiveis();
    
    if (workflows.length > 0) {
      const workflowId = workflows[0].id;
      
      // Testar criação de instância
      const instanciaId = await this.testarCriacaoInstancia(workflowId);
      
      // Testar obtenção de instância
      await this.testarObterInstancia(instanciaId);
      
      // Testar transição de estado
      await this.testarTransicaoEstado(instanciaId);
      
      // Testar adição de comentário
      await this.testarAdicionarComentario(instanciaId);
      
      // Testar listagem de instâncias
      await this.testarListagemInstancias();
    }
    
    console.log('✅ Testes de instâncias concluídos\n');
  }
  
  async obterWorkflowsDisponiveis() {
    try {
      const response = await axios.get(`${API_BASE}/workflows?ativo=true`);
      return response.data.workflows || [];
    } catch (error) {
      return [];
    }
  }
  
  async testarCriacaoInstancia(workflowId) {
    try {
      const novaInstancia = {
        workflow_id: workflowId,
        titulo: 'Instância de Teste Automatizado',
        dados_contexto: {
          descricao: 'Teste automatizado do sistema',
          prioridade: 'alta',
          valor: 1500
        },
        origem_tipo: 'manual'
      };
      
      const response = await axios.post(`${API_BASE}/workflows/instancias`, novaInstancia);
      
      if (response.status === 201 && response.data.instancia.id) {
        this.registrarTeste('Criar Instância', true, `Instância criada com ID ${response.data.instancia.id}`);
        return response.data.instancia.id;
      } else {
        throw new Error('Instância não foi criada');
      }
      
    } catch (error) {
      this.registrarTeste('Criar Instância', false, error.message);
      return null;
    }
  }
  
  async testarObterInstancia(instanciaId) {
    if (!instanciaId) return;
    
    try {
      const response = await axios.get(`${API_BASE}/workflows/instancias/${instanciaId}`);
      
      if (response.status === 200 && response.data.instancia) {
        this.registrarTeste('Obter Instância', true, `Instância ${instanciaId} obtida com sucesso`);
      } else {
        throw new Error('Instância não encontrada');
      }
      
    } catch (error) {
      this.registrarTeste('Obter Instância', false, error.message);
    }
  }
  
  async testarTransicaoEstado(instanciaId) {
    if (!instanciaId) return;
    
    try {
      // Primeiro, obter os próximos estados disponíveis
      const instanciaResponse = await axios.get(`${API_BASE}/workflows/instancias/${instanciaId}`);
      const proximosEstados = instanciaResponse.data.proximos_estados;
      
      if (proximosEstados && proximosEstados.length > 0) {
        const proximoEstado = proximosEstados[0].estado;
        
        const transicao = {
          proximo_estado: proximoEstado,
          observacoes: 'Transição realizada durante teste automatizado',
          dados_adicionais: {
            teste: true
          }
        };
        
        const response = await axios.post(`${API_BASE}/workflows/instancias/${instanciaId}/transicionar`, transicao);
        
        if (response.status === 200) {
          this.registrarTeste('Transição Estado', true, `Estado transicionado para ${proximoEstado}`);
        } else {
          throw new Error('Falha na transição');
        }
      } else {
        this.registrarTeste('Transição Estado', true, 'Nenhuma transição disponível (esperado)');
      }
      
    } catch (error) {
      this.registrarTeste('Transição Estado', false, error.message);
    }
  }
  
  async testarAdicionarComentario(instanciaId) {
    if (!instanciaId) return;
    
    try {
      const comentario = {
        comentario: 'Comentário adicionado durante teste automatizado',
        publico: true
      };
      
      const response = await axios.post(`${API_BASE}/workflows/instancias/${instanciaId}/comentarios`, comentario);
      
      if (response.status === 200) {
        this.registrarTeste('Adicionar Comentário', true, 'Comentário adicionado com sucesso');
      } else {
        throw new Error('Falha ao adicionar comentário');
      }
      
    } catch (error) {
      this.registrarTeste('Adicionar Comentário', false, error.message);
    }
  }
  
  async testarListagemInstancias() {
    try {
      const response = await axios.get(`${API_BASE}/workflows/instancias`);
      
      if (response.status === 200 && Array.isArray(response.data.instancias)) {
        this.registrarTeste('Listar Instâncias', true, `${response.data.instancias.length} instâncias encontradas`);
      } else {
        throw new Error('Resposta inválida');
      }
      
    } catch (error) {
      this.registrarTeste('Listar Instâncias', false, error.message);
    }
  }
  
  async testarAcoes() {
    console.log('🔧 Testando ações de workflow...');
    
    // Testar execução de ações automáticas
    await this.testarExecucaoAcoesAutomaticas();
    
    console.log('✅ Testes de ações concluídos\n');
  }
  
  async testarExecucaoAcoesAutomaticas() {
    try {
      const response = await axios.post(`${API_BASE}/workflows/acoes/automaticas`);
      
      if (response.status === 200) {
        this.registrarTeste('Executar Ações Automáticas', true, 'Ações automáticas executadas');
      } else {
        throw new Error('Falha na execução');
      }
      
    } catch (error) {
      this.registrarTeste('Executar Ações Automáticas', false, error.message);
    }
  }
  
  async testarEstatisticas() {
    console.log('📊 Testando estatísticas de workflow...');
    
    // Testar estatísticas gerais
    await this.testarEstatisticasGerais();
    
    console.log('✅ Testes de estatísticas concluídos\n');
  }
  
  async testarEstatisticasGerais() {
    try {
      const response = await axios.get(`${API_BASE}/workflows/estatisticas`);
      
      if (response.status === 200 && response.data.instancias) {
        this.registrarTeste('Estatísticas Gerais', true, `${response.data.instancias.total} instâncias no sistema`);
      } else {
        throw new Error('Resposta inválida');
      }
      
    } catch (error) {
      this.registrarTeste('Estatísticas Gerais', false, error.message);
    }
  }
  
  async testarAutomacao() {
    console.log('🤖 Testando automação de workflow...');
    
    // Testar verificação de workflows vencidos
    await this.testarVerificacaoVencidos();
    
    console.log('✅ Testes de automação concluídos\n');
  }
  
  async testarVerificacaoVencidos() {
    try {
      const response = await axios.post(`${API_BASE}/workflows/verificar-vencidos`);
      
      if (response.status === 200) {
        this.registrarTeste('Verificar Vencidos', true, `${response.data.instancias_vencidas || 0} instâncias vencidas processadas`);
      } else {
        throw new Error('Falha na verificação');
      }
      
    } catch (error) {
      this.registrarTeste('Verificar Vencidos', false, error.message);
    }
  }
  
  registrarTeste(nome, passou, detalhes) {
    this.resultados.total_testes++;
    
    if (passou) {
      this.resultados.testes_passou++;
      console.log(`✅ ${nome}: ${detalhes}`);
    } else {
      this.resultados.testes_falhou++;
      console.log(`❌ ${nome}: ${detalhes}`);
    }
    
    this.resultados.detalhes.push({
      nome,
      passou,
      detalhes,
      timestamp: new Date().toISOString()
    });
  }
  
  exibirRelatorioFinal() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RELATÓRIO FINAL DOS TESTES - SISTEMA DE WORKFLOW');
    console.log('='.repeat(60));
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Total de testes: ${this.resultados.total_testes}`);
    console.log(`   ✅ Passou: ${this.resultados.testes_passou}`);
    console.log(`   ❌ Falhou: ${this.resultados.testes_falhou}`);
    
    const percentualSucesso = this.resultados.total_testes > 0 
      ? Math.round((this.resultados.testes_passou / this.resultados.total_testes) * 100)
      : 0;
    
    console.log(`   📈 Taxa de sucesso: ${percentualSucesso}%`);
    
    if (this.resultados.testes_falhou > 0) {
      console.log(`\n❌ TESTES QUE FALHARAM:`);
      this.resultados.detalhes
        .filter(t => !t.passou)
        .forEach(teste => {
          console.log(`   • ${teste.nome}: ${teste.detalhes}`);
        });
    }
    
    console.log(`\n🎯 STATUS GERAL: ${percentualSucesso >= 80 ? '✅ SISTEMA OPERACIONAL' : '⚠️ NECESSITA CORREÇÕES'}`);
    
    // Salvar relatório em arquivo
    this.salvarRelatorio();
    
    console.log('='.repeat(60));
  }
  
  salvarRelatorio() {
    try {
      const nomeArquivo = `relatorio-workflow-${new Date().toISOString().split('T')[0]}.json`;
      
      const relatorio = {
        timestamp: new Date().toISOString(),
        sistema: 'Sistema de Workflow',
        versao: '1.0.0',
        ...this.resultados
      };
      
      fs.writeFileSync(nomeArquivo, JSON.stringify(relatorio, null, 2));
      console.log(`📄 Relatório salvo em: ${nomeArquivo}`);
      
    } catch (error) {
      console.log(`⚠️ Erro ao salvar relatório: ${error.message}`);
    }
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new WorkflowTester();
  tester.executarTodosOsTestes();
}

module.exports = WorkflowTester;