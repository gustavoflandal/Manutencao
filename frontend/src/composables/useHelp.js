import { ref, computed, reactive } from 'vue'

// Estado global do sistema de ajuda
const helpState = reactive({
  currentSection: '',
  searchQuery: '',
  favorites: JSON.parse(localStorage.getItem('help-favorites') || '[]'),
  recentlyViewed: JSON.parse(localStorage.getItem('help-recent') || '[]'),
  showContextualHelp: false,
  contextualContent: null,
  // Tutorial state
  activeTutorial: null,
  completedTutorials: JSON.parse(localStorage.getItem('completed-tutorials') || '[]'),
  tutorialPreferences: JSON.parse(localStorage.getItem('tutorial-preferences') || '{ "autoStart": true, "showHints": true }')
})

// Base de dados de documentacao
const helpDatabase = ref({
  dashboard: {
    id: 'dashboard',
    title: 'Dashboard e Painel de Controle',
    icon: 'dashboard',
    description: 'Central de informacoes e metricas do sistema',
    sections: [
      {
        id: 'overview',
        title: 'Visao Geral do Dashboard',
        content: `
          <h3>O que e o Dashboard?</h3>
          <p>O Dashboard e sua central de comando no UpKeep Pro. Aqui voce encontra:</p>
          <ul>
            <li>Metricas em tempo real do sistema</li>
            <li>Resumo de solicitacoes pendentes</li>
            <li>Status de ordens de servico</li>
            <li>Indicadores de performance</li>
            <li>Acoes rapidas para tarefas comuns</li>
          </ul>
          
          <h4>Como navegar:</h4>
          <ol>
            <li>Visualize os cards com informacoes resumidas</li>
            <li>Use os botoes de acao rapida para criar novos itens</li>
            <li>Clique nos numeros para ver detalhes</li>
            <li>Acesse outras paginas atraves do menu superior</li>
          </ol>
        `,
        examples: [
          {
            title: 'Criando uma nova solicitacao',
            description: 'Use o botao "Nova Solicitacao" para criar rapidamente uma nova solicitacao de manutencao.',
            code: 'Clique em "Nova Solicitacao" → Preencha os campos → Clique em "Salvar"'
          }
        ],
        tips: [
          'Os numeros nos cards sao atualizados automaticamente',
          'Voce pode personalizar quais metricas aparecem no seu dashboard',
          'Use Ctrl+D para ir direto ao dashboard de qualquer pagina'
        ],
        relatedPages: ['solicitacoes', 'ordens-servico', 'usuarios']
      }
    ]
  },
  
  solicitacoes: {
    id: 'solicitacoes',
    title: 'Solicitacoes de Manutencao',
    icon: 'file-text',
    description: 'Gerenciamento completo de solicitacoes de manutencao',
    sections: [
      {
        id: 'criar-solicitacao',
        title: 'Como Criar uma Solicitacao',
        content: `
          <h3>Passo a passo para criar solicitacoes</h3>
          <p>As solicitacoes sao o ponto de partida para qualquer servico de manutencao:</p>
          
          <h4>1. Acessando o formulario:</h4>
          <ul>
            <li>Clique em "Solicitacoes" no menu</li>
            <li>Clique no botao "Nova Solicitacao"</li>
            <li>Ou use o atalho no Dashboard</li>
          </ul>
          
          <h4>2. Preenchendo os dados obrigatorios:</h4>
          <ul>
            <li><strong>Titulo:</strong> Descricao resumida do problema</li>
            <li><strong>Descricao:</strong> Detalhes completos do que precisa ser feito</li>
            <li><strong>Categoria:</strong> Tipo de servico (eletrica, hidraulica, etc.)</li>
            <li><strong>Prioridade:</strong> Urgencia da solicitacao</li>
            <li><strong>Local:</strong> Onde o servico deve ser executado</li>
          </ul>
          
          <h4>3. Campos opcionais:</h4>
          <ul>
            <li>Anexos (fotos, documentos)</li>
            <li>Data preferencial</li>
            <li>Observacoes adicionais</li>
            <li>Responsavel preferencial</li>
          </ul>
        `,
        examples: [
          {
            title: 'Exemplo de solicitacao bem estruturada',
            description: 'Modelo de como preencher uma solicitacao de forma clara e completa.',
            code: `
Titulo: "Vazamento na torneira do banheiro terreo"
Descricao: "Torneira da pia do banheiro masculino do terreo esta vazando constantemente. O vazamento comecou ontem e esta molhando o piso."
Categoria: Hidraulica
Prioridade: Media
Local: Banheiro terreo - Bloco A
            `
          }
        ],
        tips: [
          'Seja especifico na descricao - isso acelera o atendimento',
          'Anexe fotos sempre que possivel',
          'Escolha a prioridade correta para nao atrasar outros servicos',
          'Verifique se o local esta correto antes de salvar'
        ],
        troubleshooting: [
          {
            problem: 'Nao consigo anexar arquivos',
            solution: 'Verifique se o arquivo tem menos de 10MB e esta em formato permitido (JPG, PNG, PDF, DOC)'
          },
          {
            problem: 'Categoria nao aparece na lista',
            solution: 'Entre em contato com o administrador para cadastrar novas categorias'
          }
        ]
      },
      {
        id: 'acompanhar-solicitacao',
        title: 'Acompanhando Solicitacoes',
        content: `
          <h3>Como acompanhar o status das suas solicitacoes</h3>
          
          <h4>Estados de uma solicitacao:</h4>
          <ul>
            <li><span class="status-badge pending">Pendente</span> - Aguardando analise</li>
            <li><span class="status-badge approved">Aprovada</span> - Aprovada para execucao</li>
            <li><span class="status-badge in-progress">Em Andamento</span> - Sendo executada</li>
            <li><span class="status-badge completed">Concluida</span> - Servico finalizado</li>
            <li><span class="status-badge cancelled">Cancelada</span> - Solicitacao cancelada</li>
          </ul>
          
          <h4>Filtrando solicitacoes:</h4>
          <p>Use os filtros para encontrar rapidamente suas solicitacoes:</p>
          <ul>
            <li>Por status (pendente, aprovada, etc.)</li>
            <li>Por data de criacao</li>
            <li>Por categoria</li>
            <li>Por prioridade</li>
            <li>Por responsavel</li>
          </ul>
          
          <h4>Notificacoes:</h4>
          <p>Voce recebera notificacoes quando:</p>
          <ul>
            <li>Sua solicitacao for aprovada</li>
            <li>O trabalho for iniciado</li>
            <li>Houver atualizacoes de progresso</li>
            <li>O servico for concluido</li>
          </ul>
        `,
        examples: [
          {
            title: 'Encontrando solicitacoes urgentes',
            description: 'Como filtrar para ver apenas solicitacoes de alta prioridade.',
            code: 'Filtros → Prioridade → "Alta" → Aplicar'
          },
          {
            title: 'Buscar por texto',
            description: 'Encontrar solicitacoes por palavras-chave no titulo ou descricao.',
            code: 'Campo de busca → Digite "vazamento" → Enter'
          }
        ],
        tips: [
          'Use a busca por texto para encontrar solicitacoes especificas rapidamente',
          'Combine multiplos filtros para resultados mais precisos',
          'Clique no titulo da solicitacao para ver todos os detalhes',
          'O status e atualizado automaticamente conforme o progresso'
        ],
        troubleshooting: [
          {
            problem: 'Nao consigo ver minha solicitacao na lista',
            solution: 'Verifique se nao ha filtros aplicados que possam estar ocultando sua solicitacao. Clique em "Limpar Filtros" para ver todas.'
          },
          {
            problem: 'Status nao esta atualizando',
            solution: 'Atualize a pagina (F5) ou aguarde alguns minutos. Se o problema persistir, entre em contato com o administrador.'
          }
        ],
        relatedPages: ['ordens-servico', 'usuarios']
      },
      {
        id: 'categorias-priori­dades',
        title: 'Entendendo Categorias e Prioridades',
        content: `
          <h3>Como escolher a categoria e prioridade corretas</h3>
          
          <h4>Categorias Principais:</h4>
          <ul>
            <li><strong>Eletrica:</strong> Problemas com instalacoes eletricas, iluminacao, tomadas</li>
            <li><strong>Hidraulica:</strong> Vazamentos, entupimentos, problemas com agua</li>
            <li><strong>Ar Condicionado:</strong> Manutencao e reparo de sistemas de climatizacao</li>
            <li><strong>Estrutural:</strong> Problemas com paredes, pisos, tetos, portas, janelas</li>
            <li><strong>Limpeza:</strong> Servicos de limpeza especializada</li>
            <li><strong>Seguranca:</strong> Cameras, alarmes, controle de acesso</li>
            <li><strong>Informatica:</strong> Equipamentos de TI, rede, telefonia</li>
            <li><strong>Outros:</strong> Servicos que nao se encaixam nas categorias anteriores</li>
          </ul>
          
          <h4>Niveis de Prioridade:</h4>
          <ul>
            <li><strong>Urgente:</strong> Risco a seguranca, impacta operacao critica (4-8 horas)</li>
            <li><strong>Alta:</strong> Impacta produtividade significativamente (1-2 dias)</li>
            <li><strong>Media:</strong> Incomodo moderado, pode aguardar (3-5 dias)</li>
            <li><strong>Baixa:</strong> Melhoria ou manutencao preventiva (1-2 semanas)</li>
          </ul>
          
          <h4>Exemplos de classificacao:</h4>
          <div class="examples-grid">
            <div class="example-item urgent">
              <strong>URGENTE:</strong> Vazamento no teto da sala de servidores
            </div>
            <div class="example-item high">
              <strong>ALTA:</strong> Ar condicionado parado no escritorio principal
            </div>
            <div class="example-item medium">
              <strong>MeDIA:</strong> Torneira pingando no banheiro
            </div>
            <div class="example-item low">
              <strong>BAIXA:</strong> Pintura descascando na parede externa
            </div>
          </div>
        `,
        examples: [
          {
            title: 'Solicitacao Urgente - Vazamento',
            description: 'Exemplo de como classificar um vazamento que pode causar danos.',
            code: `
Categoria: Hidraulica
Prioridade: Urgente
Titulo: "Vazamento no teto da sala de equipamentos"
Descricao: "Grande vazamento no teto esta molhando equipamentos importantes. Risco de dano aos servidores."
            `
          },
          {
            title: 'Solicitacao Baixa - Manutencao',
            description: 'Exemplo de manutencao preventiva que pode aguardar.',
            code: `
Categoria: Estrutural
Prioridade: Baixa
Titulo: "Repintura da fachada do predio"
Descricao: "A tinta da fachada esta desbotada. Solicito repintura para melhorar a aparencia."
            `
          }
        ],
        tips: [
          'Na duvida entre duas categorias, escolha a mais especifica',
          'Prioridade Urgente deve ser usada apenas para emergencias reais',
          'Descreva sempre o impacto do problema na operacao',
          'Se nao souber a categoria, use "Outros" e seja detalhado na descricao'
        ]
      }
    ]
  },
  
  ordens_servico: {
    id: 'ordens_servico',
    title: 'Ordens de Servico',
    icon: 'tool',
    description: 'Gestao e execucao de ordens de servico',
    sections: [
      {
        id: 'executar-ordem',
        title: 'Executando Ordens de Servico',
        content: `
          <h3>Processo de execucao de ordens</h3>
          <p>As ordens de servico sao criadas automaticamente a partir das solicitacoes aprovadas.</p>
          
          <h4>Fluxo de trabalho:</h4>
          <ol>
            <li><strong>Receber a ordem:</strong> Voce sera notificado quando uma ordem for atribuida a voce</li>
            <li><strong>Analisar materiais:</strong> Verifique se todos os materiais necessarios estao disponiveis</li>
            <li><strong>Iniciar execucao:</strong> Mude o status para "Em Andamento" ao comecar o trabalho</li>
            <li><strong>Registrar progresso:</strong> Adicione comentarios e fotos durante a execucao</li>
            <li><strong>Finalizar com relatorio:</strong> Complete com relatorio detalhado e evidencias</li>
          </ol>
          
          <h4>Campos obrigatorios ao finalizar:</h4>
          <ul>
            <li>Descricao do servico realizado</li>
            <li>Materiais utilizados</li>
            <li>Tempo gasto</li>
            <li>Observacoes importantes</li>
            <li>Fotos do resultado (quando aplicavel)</li>
          </ul>
          
          <h4>Boas praticas:</h4>
          <ul>
            <li>Sempre fotografe o problema antes de iniciar</li>
            <li>Mantenha o solicitante informado sobre o progresso</li>
            <li>Registre qualquer dificuldade encontrada</li>
            <li>Teste a solucao antes de finalizar</li>
            <li>Deixe o local limpo e organizado</li>
          </ul>
        `,
        examples: [
          {
            title: 'Relatorio de finalizacao completo',
            description: 'Modelo de como preencher o relatorio ao concluir uma ordem.',
            code: `
Servico Realizado: "Substituicao de torneira com vazamento"
Materiais: "1 torneira modelo XYZ, 2m de fita veda rosca, 1 registro"
Tempo Gasto: "2 horas"
Observacoes: "Problema causado por rosca danificada. Substituida completamente. Testado por 30min sem vazamentos."
            `
          }
        ],
        tips: [
          'Fotografe antes, durante e depois do servico',
          'Registre o tempo real gasto - isso ajuda no planejamento futuro',
          'Se precisar de materiais extras, solicite antes de iniciar',
          'Comunique problemas complexos imediatamente ao supervisor'
        ],
        troubleshooting: [
          {
            problem: 'Nao tenho acesso aos materiais necessarios',
            solution: 'Entre em contato com o almoxarifado ou supervisor para liberar os materiais. Anote isso na ordem de servico.'
          },
          {
            problem: 'O problema e mais complexo que o descrito',
            solution: 'Pare o trabalho e comunique o supervisor. Documente a situacao real encontrada na ordem de servico.'
          }
        ]
      },
      {
        id: 'materiais-ferramentas',
        title: 'Gestao de Materiais e Ferramentas',
        content: `
          <h3>Como requisitar e controlar materiais</h3>
          
          <h4>Processo de requisicao:</h4>
          <ol>
            <li>Analise a ordem de servico e liste materiais necessarios</li>
            <li>Verifique disponibilidade no almoxarifado</li>
            <li>Faca a requisicao atraves do sistema</li>
            <li>Aguarde aprovacao (se necessario)</li>
            <li>Retire os materiais no almoxarifado</li>
          </ol>
          
          <h4>Controle de ferramentas:</h4>
          <ul>
            <li>Mantenha inventario atualizado</li>
            <li>Reporte ferramentas danificadas imediatamente</li>
            <li>Solicite manutencao preventiva regularmente</li>
            <li>Devolva ferramentas emprestadas no prazo</li>
          </ul>
        `,
        tips: [
          'Sempre peca 10% a mais de materiais para imprevistos',
          'Mantenha suas ferramentas organizadas e limpas',
          'Relate o consumo real de materiais apos cada servico'
        ]
      }
    ]
  },
  
  usuarios: {
    id: 'usuarios',
    title: 'Gestao de Usuarios',
    icon: 'users',
    description: 'Administracao de usuarios e permissoes',
    sections: [
      {
        id: 'criar-usuario',
        title: 'Criando Novos Usuarios',
        content: `
          <h3>Como cadastrar usuarios no sistema</h3>
          <p>Apenas administradores podem criar novos usuarios.</p>
          
          <h4>Informacoes obrigatorias:</h4>
          <ul>
            <li>Nome completo</li>
            <li>Email (sera usado para login)</li>
            <li>Perfil (solicitante, tecnico, supervisor, administrador)</li>
            <li>Departamento</li>
            <li>Senha inicial</li>
          </ul>
        `
      }
    ]
  },
  
  relatorios: {
    id: 'relatorios',
    title: 'Relatorios e Analytics',
    icon: 'bar-chart',
    description: 'Geracao de relatorios e analises',
    sections: [
      {
        id: 'gerar-relatorio',
        title: 'Gerando Relatorios',
        content: `
          <h3>Como gerar e exportar relatorios</h3>
          
          <h4>Tipos de relatorio disponiveis:</h4>
          <ul>
            <li>Dashboard Executivo</li>
            <li>Relatorio de Solicitacoes</li>
            <li>Performance de Departamentos</li>
            <li>Inventario de Estoque</li>
            <li>Controle de Ativos</li>
            <li>Analytics e KPIs</li>
          </ul>
          
          <h4>Formatos de exportacao:</h4>
          <ul>
            <li>Excel (.xlsx) - Para analise de dados</li>
            <li>PDF (.pdf) - Para impressao e apresentacao</li>
            <li>Visualizacao online - Para consulta rapida</li>
          </ul>
        `
      }
    ]
  },
  
  configuracoes: {
    id: 'configuracoes',
    title: 'Configuracoes do Sistema',
    icon: 'settings',
    description: 'Configuracoes gerais e personalizacao',
    sections: [
      {
        id: 'personalizar-perfil',
        title: 'Personalizando seu Perfil',
        content: `
          <h3>Como personalizar suas configuracoes</h3>
          
          <h4>Informacoes do perfil:</h4>
          <ul>
            <li>Alterar senha</li>
            <li>Atualizar informacoes pessoais</li>
            <li>Configurar notificacoes</li>
            <li>Definir preferencias de tema</li>
          </ul>
        `
      }
    ]
  }
})

// Base de dados de tutoriais
const tutorialDatabase = ref({
  // Tutorial de primeiro uso
  'first-time-user': {
    id: 'first-time-user',
    title: 'Bem-vindo ao UpKeep Pro',
    description: 'Tour inicial para novos usuarios',
    category: 'introducao',
    duration: '5-8 minutos',
    autoStart: true,
    prerequisites: [],
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo ao UpKeep Pro!',
        description: 'Sistema completo de gestao de manutencao e ativos. Vamos comecar com um tour rapido.',
        element: null,
        position: 'center',
        image: '/assets/tutorial/welcome.png',
        action: null
      },
      {
        id: 'dashboard',
        title: 'Dashboard - Sua Central de Comando',
        description: 'Aqui voce encontra um resumo de todas as atividades importantes. Metricas, alertas e informacoes em tempo real.',
        element: '.dashboard-container',
        position: 'bottom',
        tips: [
          'Os cartoes mostram dados em tempo real',
          'Use os filtros para personalizar a visualizacao',
          'Clique nos numeros para acessar detalhes'
        ]
      },
      {
        id: 'menu',
        title: 'Menu Principal',
        description: 'Use o menu lateral para navegar entre os modulos do sistema.',
        element: '.sidebar-nav',
        position: 'right',
        action: {
          text: 'Expandir Menu',
          icon: 'menu',
          click: '.sidebar-toggle'
        }
      },
      {
        id: 'solicitacoes',
        title: 'Solicitacoes de Manutencao',
        description: 'Crie e gerencie solicitacoes de manutencao. Este e o ponto de entrada para todas as demandas.',
        element: '[href="/solicitacoes"]',
        position: 'right',
        action: {
          text: 'Acessar Solicitacoes',
          icon: 'clipboard-list',
          callback: () => router.push('/solicitacoes')
        }
      },
      {
        id: 'help',
        title: 'Sistema de Ajuda',
        description: 'Sempre que precisar de orientacao, use o botao de ajuda flutuante ou acesse o menu de ajuda.',
        element: '.help-button',
        position: 'left',
        tips: [
          'Clique no icone de ajuda em qualquer tela',
          'Use Ctrl+H para acesso rapido',
          'Encontre exemplos praticos e dicas'
        ]
      },
      {
        id: 'complete',
        title: 'Pronto para Comecar!',
        description: 'Voce agora conhece os pontos principais do sistema. Explore com confianca!',
        element: null,
        position: 'center',
        action: {
          text: 'Explorar Sistema',
          icon: 'rocket',
          callback: () => router.push('/dashboard')
        }
      }
    ]
  },
  
  // Tutorial para solicitacoes
  'solicitacoes-tutorial': {
    id: 'solicitacoes-tutorial',
    title: 'Como Criar Solicitacoes',
    description: 'Aprenda a criar e gerenciar solicitacoes de manutencao',
    category: 'solicitacoes',
    duration: '3-5 minutos',
    autoStart: false,
    prerequisites: ['first-time-user'],
    steps: [
      {
        id: 'intro',
        title: 'Solicitacoes de Manutencao',
        description: 'As solicitacoes sao o primeiro passo no processo de manutencao. Vamos aprender a criar uma.',
        element: '.page-header',
        position: 'bottom'
      },
      {
        id: 'new-button',
        title: 'Criar Nova Solicitacao',
        description: 'Clique neste botao para abrir o formulario de nova solicitacao.',
        element: '.btn-primary[data-action="new"]',
        position: 'bottom',
        action: {
          text: 'Criar Solicitacao',
          icon: 'plus',
          click: '.btn-primary[data-action="new"]'
        }
      },
      {
        id: 'form-fields',
        title: 'Preenchendo o Formulario',
        description: 'Preencha os campos obrigatorios. O titulo deve ser claro e descritivo.',
        element: '.form-container',
        position: 'right',
        tips: [
          'Use titulos descritivos',
          'Selecione a prioridade adequada',
          'Adicione fotos quando necessario',
          'Escolha o setor responsavel'
        ]
      },
      {
        id: 'attachments',
        title: 'Anexos e Fotos',
        description: 'Adicione fotos e documentos que ajudem a entender o problema.',
        element: '.file-upload-area',
        position: 'top',
        tips: [
          'Fotos facilitam o diagnostico',
          'Documentos tecnicos sao bem-vindos',
          'Maximo 10MB por arquivo'
        ]
      },
      {
        id: 'submit',
        title: 'Finalizando a Solicitacao',
        description: 'Revise as informacoes e envie a solicitacao. Ela sera direcionada para a equipe responsavel.',
        element: '.submit-button',
        position: 'top',
        action: {
          text: 'Enviar Solicitacao',
          icon: 'send',
          click: '.submit-button'
        }
      }
    ]
  },
  
  // Tutorial para ordens de servico
  'ordens-tutorial': {
    id: 'ordens-tutorial',
    title: 'Gerenciando Ordens de Servico',
    description: 'Como trabalhar com ordens de servico eficientemente',
    category: 'ordens',
    duration: '4-6 minutos',
    autoStart: false,
    prerequisites: ['solicitacoes-tutorial'],
    steps: [
      {
        id: 'intro',
        title: 'Ordens de Servico',
        description: 'As ordens sao criadas a partir das solicitacoes aprovadas. Aqui voce planeja e executa o trabalho.',
        element: '.orders-container',
        position: 'top'
      },
      {
        id: 'status-flow',
        title: 'Fluxo de Status',
        description: 'Entenda os diferentes status e como uma ordem progride.',
        element: '.status-badges',
        position: 'bottom',
        image: '/assets/tutorial/status-flow.png',
        tips: [
          'Pendente: Aguardando aprovacao',
          'Planejada: Recursos alocados',
          'Em Execucao: Trabalho em andamento',
          'Concluida: Trabalho finalizado'
        ]
      },
      {
        id: 'assignment',
        title: 'Atribuicao de Tecnicos',
        description: 'Atribua tecnicos qualificados para executar o servico.',
        element: '.technician-selector',
        position: 'right',
        action: {
          text: 'Selecionar Tecnico',
          icon: 'user-plus',
          click: '.technician-dropdown'
        }
      },
      {
        id: 'materials',
        title: 'Materiais e Ferramentas',
        description: 'Liste todos os materiais e ferramentas necessarios.',
        element: '.materials-section',
        position: 'left',
        tips: [
          'Verifique disponibilidade no estoque',
          'Solicite compras antecipadamente',
          'Liste ferramentas especiais'
        ]
      },
      {
        id: 'execution',
        title: 'Executando o Servico',
        description: 'Durante a execucao, registre progresso e atualize o status.',
        element: '.execution-panel',
        position: 'top',
        video: '/assets/tutorial/execution-demo.mp4'
      }
    ]
  },
  
  // Tutorial para relatorios
  'relatorios-tutorial': {
    id: 'relatorios-tutorial',
    title: 'Gerando Relatorios',
    description: 'Como criar e personalizar relatorios',
    category: 'relatorios',
    duration: '3-4 minutos',
    autoStart: false,
    prerequisites: [],
    steps: [
      {
        id: 'types',
        title: 'Tipos de Relatorios',
        description: 'Conheca os diferentes tipos de relatorios disponiveis.',
        element: '.report-types',
        position: 'bottom',
        tips: [
          'Operacionais: Atividades do dia a dia',
          'Gerenciais: Visao estrategica',
          'Customizados: Personalizados'
        ]
      },
      {
        id: 'filters',
        title: 'Filtros e Parametros',
        description: 'Use filtros para obter exatamente os dados que precisa.',
        element: '.filters-panel',
        position: 'right',
        action: {
          text: 'Configurar Filtros',
          icon: 'filter',
          click: '.filter-button'
        }
      },
      {
        id: 'export',
        title: 'Exportacao e Compartilhamento',
        description: 'Exporte seus relatorios em diferentes formatos.',
        element: '.export-options',
        position: 'left',
        tips: [
          'PDF para apresentacoes',
          'Excel para analises',
          'CSV para integracoes'
        ]
      }
    ]
  }
})

export default function useHelp() {
  // Computed properties
  const allSections = computed(() => {
    const sections = []
    Object.values(helpDatabase.value).forEach(module => {
      module.sections.forEach(section => {
        sections.push({
          ...section,
          moduleId: module.id,
          moduleTitle: module.title,
          moduleIcon: module.icon
        })
      })
    })
    return sections
  })
  
  const filteredSections = computed(() => {
    if (!helpState.searchQuery) return allSections.value
    
    const query = helpState.searchQuery.toLowerCase()
    return allSections.value.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.content.toLowerCase().includes(query) ||
      section.moduleTitle.toLowerCase().includes(query)
    )
  })
  
  const currentModule = computed(() => {
    if (!helpState.currentSection) return null
    return Object.values(helpDatabase.value).find(module =>
      module.sections.some(section => section.id === helpState.currentSection)
    )
  })
  
  const currentSectionData = computed(() => {
    if (!currentModule.value) return null
    return currentModule.value.sections.find(section => 
      section.id === helpState.currentSection
    )
  })
  
  // Methods
  function setCurrentSection(sectionId) {
    helpState.currentSection = sectionId
    addToRecentlyViewed(sectionId)
  }
  
  function addToRecentlyViewed(sectionId) {
    const recent = helpState.recentlyViewed.filter(id => id !== sectionId)
    recent.unshift(sectionId)
    helpState.recentlyViewed = recent.slice(0, 10) // Manter apenas os 10 mais recentes
    localStorage.setItem('help-recent', JSON.stringify(helpState.recentlyViewed))
  }
  
  function toggleFavorite(sectionId) {
    const index = helpState.favorites.indexOf(sectionId)
    if (index > -1) {
      helpState.favorites.splice(index, 1)
    } else {
      helpState.favorites.push(sectionId)
    }
    localStorage.setItem('help-favorites', JSON.stringify(helpState.favorites))
  }
  
  function isFavorite(sectionId) {
    return helpState.favorites.includes(sectionId)
  }
  
  function searchHelp(query) {
    helpState.searchQuery = query
  }
  
  function clearSearch() {
    helpState.searchQuery = ''
  }
  
  function showContextualHelp(pageId, content = null) {
    helpState.showContextualHelp = true
    helpState.contextualContent = content || getContextualContent(pageId)
  }
  
  function hideContextualHelp() {
    helpState.showContextualHelp = false
    helpState.contextualContent = null
  }
  
  function getContextualContent(pageId) {
    const module = helpDatabase.value[pageId]
    if (!module) return null
    
    return {
      title: module.title,
      description: module.description,
      quickTips: module.sections[0]?.tips || [],
      relatedSections: module.sections.map(section => ({
        id: section.id,
        title: section.title
      }))
    }
  }
  
  function getModuleProgress(moduleId) {
    const module = helpDatabase.value[moduleId]
    if (!module) return 0
    
    const viewedSections = module.sections.filter(section =>
      helpState.recentlyViewed.includes(section.id)
    ).length
    
    return Math.round((viewedSections / module.sections.length) * 100)
  }
  
  function getSectionByPath(moduleId, sectionId) {
    const module = helpDatabase.value[moduleId]
    if (!module) return null
    
    return module.sections.find(section => section.id === sectionId)
  }
  
  // Tutorial functions
  function startTutorial(tutorialId) {
    const tutorial = tutorialDatabase.value[tutorialId]
    if (!tutorial) return false
    
    // Verificar se ja foi completado
    if (helpState.completedTutorials.includes(tutorialId)) {
      return false
    }
    
    // Verificar pre-requisitos
    const missingPrereqs = tutorial.prerequisites.filter(prereq => 
      !helpState.completedTutorials.includes(prereq)
    )
    
    if (missingPrereqs.length > 0) {
      console.warn(`Tutorial ${tutorialId} requer: ${missingPrereqs.join(', ')}`)
      return false
    }
    
    helpState.activeTutorial = tutorialId
    return true
  }
  
  function completeTutorial(tutorialId) {
    if (!helpState.completedTutorials.includes(tutorialId)) {
      helpState.completedTutorials.push(tutorialId)
      localStorage.setItem('completed-tutorials', JSON.stringify(helpState.completedTutorials))
    }
    helpState.activeTutorial = null
  }
  
  function skipTutorial(tutorialId) {
    // Adicionar aos completados mesmo que pulado
    completeTutorial(tutorialId)
  }
  
  function resetTutorial(tutorialId) {
    helpState.completedTutorials = helpState.completedTutorials.filter(id => id !== tutorialId)
    localStorage.setItem('completed-tutorials', JSON.stringify(helpState.completedTutorials))
  }
  
  function getAllTutorials() {
    return tutorialDatabase.value
  }
  
  function getTutorialsByCategory(category) {
    return Object.values(tutorialDatabase.value).filter(tutorial => 
      tutorial.category === category
    )
  }
  
  function getAvailableTutorials() {
    return Object.values(tutorialDatabase.value).filter(tutorial => {
      // Verificar se todos os pre-requisitos foram completados
      return tutorial.prerequisites.every(prereq => 
        helpState.completedTutorials.includes(prereq)
      )
    })
  }
  
  function getNextRecommendedTutorial() {
    const available = getAvailableTutorials()
    const notCompleted = available.filter(tutorial => 
      !helpState.completedTutorials.includes(tutorial.id)
    )
    
    // Retornar o primeiro com autoStart ou o primeiro disponivel
    return notCompleted.find(tutorial => tutorial.autoStart) || notCompleted[0] || null
  }
  
  function updateTutorialPreferences(prefs) {
    helpState.tutorialPreferences = { ...helpState.tutorialPreferences, ...prefs }
    localStorage.setItem('tutorial-preferences', JSON.stringify(helpState.tutorialPreferences))
  }
  
  function shouldShowTutorialHint(tutorialId) {
    const tutorial = tutorialDatabase.value[tutorialId]
    if (!tutorial || helpState.completedTutorials.includes(tutorialId)) {
      return false
    }
    
    // Verificar pre-requisitos
    const hasPrereqs = tutorial.prerequisites.every(prereq => 
      helpState.completedTutorials.includes(prereq)
    )
    
    return hasPrereqs && helpState.tutorialPreferences.showHints
  }
  
  function getTutorialProgress(tutorialId) {
    // Para futuro uso - rastrear progresso dentro de um tutorial
    const progressKey = `tutorial-progress-${tutorialId}`
    return JSON.parse(localStorage.getItem(progressKey) || '{ "currentStep": 0, "completed": false }')
  }
  
  function saveTutorialProgress(tutorialId, stepIndex) {
    const progressKey = `tutorial-progress-${tutorialId}`
    const progress = {
      currentStep: stepIndex,
      completed: false,
      lastUpdate: new Date().toISOString()
    }
    localStorage.setItem(progressKey, JSON.stringify(progress))
  }
  
  return {
    // State
    helpState,
    helpDatabase,
    tutorialDatabase,
    
    // Computed
    allSections,
    filteredSections,
    currentModule,
    currentSectionData,
    
    // Methods
    setCurrentSection,
    addToRecentlyViewed,
    toggleFavorite,
    isFavorite,
    searchHelp,
    clearSearch,
    showContextualHelp,
    hideContextualHelp,
    getContextualContent,
    getModuleProgress,
    getSectionByPath,
    
    // Tutorial methods
    startTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    getAllTutorials,
    getTutorialsByCategory,
    getAvailableTutorials,
    getNextRecommendedTutorial,
    updateTutorialPreferences,
    shouldShowTutorialHint,
    getTutorialProgress,
    saveTutorialProgress
  }
}

