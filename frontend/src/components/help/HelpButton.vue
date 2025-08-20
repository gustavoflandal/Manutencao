<template>
  <div class="help-button-container">
    <!-- Botão principal de ajuda -->
    <button
      @click="showHelp"
      :class="['help-button', position]"
      :title="title"
    >
      <Icon name="help-circle" class="help-icon" />
      <span v-if="showText" class="help-text">Ajuda</span>
    </button>

    <!-- Badge de notificação (se houver dicas não lidas) -->
    <div v-if="hasUnreadTips" class="notification-badge">
      {{ unreadTipsCount }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import useHelp from '@/composables/useHelp'
import { useRoute } from 'vue-router'
import Icon from '@/components/Icon.vue'

// Props
const props = defineProps({
  // Posição do botão
  position: {
    type: String,
    default: 'fixed', // 'fixed', 'relative', 'inline'
    validator: (value) => ['fixed', 'relative', 'inline'].includes(value)
  },
  
  // Mostrar texto junto com o ícone
  showText: {
    type: Boolean,
    default: false
  },
  
  // Título do botão (tooltip)
  title: {
    type: String,
    default: 'Obter ajuda sobre esta página'
  },
  
  // Conteúdo customizado para o modal
  customContent: {
    type: Object,
    default: null
  }
})

// Composables
const { showContextualHelp, getContextualContent } = useHelp()
const route = useRoute()

// Computed
const pageId = computed(() => {
  // Mapear rotas para IDs de página
  const routeMap = {
    '/dashboard': 'dashboard',
    '/solicitacoes': 'solicitacoes',
    '/ordens-servico': 'ordens_servico',
    '/usuarios': 'usuarios',
    '/reports': 'relatorios',
    '/profile': 'configuracoes'
  }
  
  return routeMap[route.path] || 'dashboard'
})

const hasUnreadTips = computed(() => {
  // TODO: Implementar lógica de dicas não lidas
  return false
})

const unreadTipsCount = computed(() => {
  // TODO: Implementar contagem de dicas não lidas
  return 0
})

// Methods
function showHelp() {
  const content = props.customContent || generatePageContent()
  showContextualHelp(pageId.value, content)
}

function generatePageContent() {
  const pageData = getPageHelpData(pageId.value)
  
  return {
    title: pageData.title,
    description: pageData.description,
    quickTips: pageData.quickTips,
    commonActions: pageData.commonActions,
    stepByStep: pageData.stepByStep,
    shortcuts: pageData.shortcuts,
    relatedSections: pageData.relatedSections
  }
}

function getPageHelpData(id) {
  const helpData = {
    dashboard: {
      title: 'Dashboard - Painel de Controle',
      description: 'Central de informações e métricas do sistema',
      quickTips: [
        'Os números nos cards são atualizados automaticamente',
        'Clique nos botões de ação rápida para tarefas comuns',
        'Use Ctrl+D para voltar ao dashboard de qualquer página'
      ],
      commonActions: [
        {
          title: 'Nova Solicitação',
          description: 'Criar uma nova solicitação de manutenção',
          icon: 'plus',
          route: '/solicitacoes/create'
        },
        {
          title: 'Ver Relatórios',
          description: 'Acessar relatórios e analytics',
          icon: 'bar-chart',
          route: '/reports'
        }
      ],
      shortcuts: [
        { keys: ['Ctrl', 'D'], description: 'Ir para Dashboard' },
        { keys: ['Ctrl', 'N'], description: 'Nova Solicitação' },
        { keys: ['Ctrl', 'R'], description: 'Atualizar dados' }
      ],
      relatedSections: [
        { id: 'overview', title: 'Visão Geral do Dashboard' }
      ]
    },
    
    solicitacoes: {
      title: 'Solicitações de Manutenção',
      description: 'Gerencie todas as solicitações de manutenção',
      quickTips: [
        'Use filtros para encontrar solicitações específicas',
        'Seja detalhado na descrição para acelerar o atendimento',
        'Anexe fotos sempre que possível'
      ],
      commonActions: [
        {
          title: 'Nova Solicitação',
          description: 'Criar uma nova solicitação',
          icon: 'plus',
          route: '/solicitacoes/create'
        },
        {
          title: 'Filtrar Lista',
          description: 'Aplicar filtros na lista',
          icon: 'filter',
          callback: () => document.querySelector('.filter-button')?.click()
        }
      ],
      stepByStep: [
        {
          title: 'Criar nova solicitação',
          description: 'Clique no botão "Nova Solicitação" no topo da página'
        },
        {
          title: 'Preencher informações',
          description: 'Complete todos os campos obrigatórios: título, descrição, categoria e prioridade'
        },
        {
          title: 'Anexar arquivos',
          description: 'Adicione fotos ou documentos que possam ajudar no atendimento'
        },
        {
          title: 'Salvar solicitação',
          description: 'Clique em "Salvar" para criar a solicitação'
        }
      ],
      shortcuts: [
        { keys: ['Ctrl', 'N'], description: 'Nova Solicitação' },
        { keys: ['Ctrl', 'F'], description: 'Buscar' },
        { keys: ['F5'], description: 'Atualizar lista' }
      ],
      relatedSections: [
        { id: 'criar-solicitacao', title: 'Como Criar uma Solicitação' },
        { id: 'acompanhar-solicitacao', title: 'Acompanhando Solicitações' }
      ]
    },
    
    ordens_servico: {
      title: 'Ordens de Serviço',
      description: 'Gerencie e execute ordens de serviço',
      quickTips: [
        'Verifique os materiais necessários antes de iniciar',
        'Registre o progresso regularmente',
        'Finalize com relatório detalhado'
      ],
      commonActions: [
        {
          title: 'Iniciar Ordem',
          description: 'Marcar ordem como em andamento',
          icon: 'play',
          callback: () => console.log('Iniciar ordem')
        },
        {
          title: 'Registrar Progresso',
          description: 'Adicionar comentário de progresso',
          icon: 'edit',
          callback: () => console.log('Registrar progresso')
        }
      ],
      relatedSections: [
        { id: 'executar-ordem', title: 'Executando Ordens de Serviço' }
      ]
    },
    
    usuarios: {
      title: 'Gestão de Usuários',
      description: 'Administre usuários e permissões do sistema',
      quickTips: [
        'Apenas administradores podem criar usuários',
        'Defina o perfil adequado para cada usuário',
        'Verifique as permissões antes de salvar'
      ],
      commonActions: [
        {
          title: 'Novo Usuário',
          description: 'Cadastrar novo usuário',
          icon: 'user-plus',
          route: '/users/create'
        },
        {
          title: 'Gerenciar Permissões',
          description: 'Configurar permissões',
          icon: 'shield',
          route: '/permissions'
        }
      ],
      relatedSections: [
        { id: 'criar-usuario', title: 'Criando Novos Usuários' }
      ]
    },
    
    relatorios: {
      title: 'Relatórios e Analytics',
      description: 'Gere relatórios e analise dados do sistema',
      quickTips: [
        'Use filtros para personalizar relatórios',
        'Exporte em Excel ou PDF conforme necessário',
        'Salve relatórios frequentes como favoritos'
      ],
      commonActions: [
        {
          title: 'Dashboard Executivo',
          description: 'Ver métricas executivas',
          icon: 'briefcase',
          callback: () => console.log('Dashboard executivo')
        },
        {
          title: 'Exportar Excel',
          description: 'Baixar em formato Excel',
          icon: 'file-spreadsheet',
          callback: () => console.log('Exportar Excel')
        }
      ],
      relatedSections: [
        { id: 'gerar-relatorio', title: 'Gerando Relatórios' }
      ]
    },
    
    configuracoes: {
      title: 'Configurações do Perfil',
      description: 'Personalize suas configurações e preferências',
      quickTips: [
        'Mantenha suas informações atualizadas',
        'Use uma senha forte',
        'Configure notificações conforme sua preferência'
      ],
      commonActions: [
        {
          title: 'Alterar Senha',
          description: 'Modificar sua senha',
          icon: 'lock',
          callback: () => console.log('Alterar senha')
        },
        {
          title: 'Configurar Notificações',
          description: 'Definir preferências de notificação',
          icon: 'bell',
          callback: () => console.log('Configurar notificações')
        }
      ],
      relatedSections: [
        { id: 'personalizar-perfil', title: 'Personalizando seu Perfil' }
      ]
    }
  }
  
  return helpData[id] || helpData.dashboard
}
</script>

<style scoped>
.help-button-container {
  position: relative;
  display: inline-block;
}

.help-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
  z-index: 100;
}

.help-button:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.help-button.fixed {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
}

.help-button.relative {
  position: relative;
  border-radius: 8px;
}

.help-button.inline {
  position: static;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.help-icon {
  font-size: 1.25rem;
}

.help-text {
  font-weight: 500;
  white-space: nowrap;
}

.notification-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: #e74c3c;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .help-button.fixed {
    bottom: 1rem;
    right: 1rem;
    width: 3rem;
    height: 3rem;
  }
  
  .help-icon {
    font-size: 1.125rem;
  }
}
</style>