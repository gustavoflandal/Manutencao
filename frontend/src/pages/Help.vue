<template>
  <div class="help-page">
    <!-- Header -->
    <div class="help-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="header-title">
            <Icon name="help-circle" class="header-icon" />
            Central de Ajuda - UpKeep Pró
          </h1>
          <p class="header-subtitle">
            Encontre tudo que você precisa saber sobre o sistema
          </p>
        </div>
        
        <!-- Busca Global -->
        <div class="search-container">
          <div class="search-box">
            <Icon name="search" class="search-icon" />
            <input
              v-model="helpState.searchQuery"
              type="text"
              placeholder="Buscar na documentação..."
              class="search-input"
              @input="searchHelp(helpState.searchQuery)"
            />
            <button
              v-if="helpState.searchQuery"
              @click="clearSearch"
              class="search-clear"
            >
              <Icon name="x" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Navigation tabs -->
    <div class="help-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'documentation' }]"
        @click="activeTab = 'documentation'"
      >
        <Icon name="book-open" />
        Documentação
      </button>
      
      <button 
        :class="['tab-btn', { active: activeTab === 'tutorials' }]"
        @click="activeTab = 'tutorials'"
      >
        <Icon name="graduation-cap" />
        Tutoriais
      </button>
      
      <button 
        :class="['tab-btn', { active: activeTab === 'faq' }]"
        @click="activeTab = 'faq'"
      >
        <Icon name="help-circle" />
        FAQ
      </button>
    </div>

    <div class="help-layout" v-show="activeTab === 'documentation'">
      <!-- Sidebar de Navegação -->
      <aside class="help-sidebar">
        <div class="sidebar-content">
          <!-- Navegação Rápida -->
          <div class="quick-nav">
            <h3 class="nav-title">Navegação Rápida</h3>
            
            <!-- Favoritos -->
            <div v-if="helpState.favorites.length > 0" class="nav-section">
              <h4 class="section-title">
                <Icon name="star" class="section-icon" />
                Favoritos
              </h4>
              <ul class="nav-list">
                <li 
                  v-for="sectionId in helpState.favorites.slice(0, 5)" 
                  :key="sectionId"
                  class="nav-item"
                >
                  <button
                    @click="setCurrentSection(sectionId)"
                    :class="['nav-link', { active: helpState.currentSection === sectionId }]"
                  >
                    <Icon :name="getSectionIcon(sectionId)" class="nav-icon" />
                    {{ getSectionTitle(sectionId) }}
                  </button>
                </li>
              </ul>
            </div>
            
            <!-- Recentemente Visualizado -->
            <div v-if="helpState.recentlyViewed.length > 0" class="nav-section">
              <h4 class="section-title">
                <Icon name="clock" class="section-icon" />
                Recente
              </h4>
              <ul class="nav-list">
                <li 
                  v-for="sectionId in helpState.recentlyViewed.slice(0, 5)" 
                  :key="sectionId"
                  class="nav-item"
                >
                  <button
                    @click="setCurrentSection(sectionId)"
                    :class="['nav-link', { active: helpState.currentSection === sectionId }]"
                  >
                    <Icon :name="getSectionIcon(sectionId)" class="nav-icon" />
                    {{ getSectionTitle(sectionId) }}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Menu Principal -->
          <nav class="main-nav">
            <h3 class="nav-title">Documentação</h3>
            
            <div 
              v-for="(module, moduleId) in helpDatabase" 
              :key="moduleId"
              class="module-section"
            >
              <div class="module-header">
                <h4 class="module-title">
                  <Icon :name="module.icon" class="module-icon" />
                  {{ module.title }}
                </h4>
                <div class="module-progress">
                  <div 
                    class="progress-bar"
                    :style="{ width: `${getModuleProgress(moduleId)}%` }"
                  ></div>
                  <span class="progress-text">{{ getModuleProgress(moduleId) }}%</span>
                </div>
              </div>
              
              <ul class="section-list">
                <li 
                  v-for="section in module.sections" 
                  :key="section.id"
                  class="section-item"
                >
                  <button
                    @click="setCurrentSection(section.id)"
                    :class="['section-link', { active: helpState.currentSection === section.id }]"
                  >
                    {{ section.title }}
                    <Icon 
                      v-if="helpState.recentlyViewed.includes(section.id)"
                      name="eye"
                      class="viewed-icon"
                    />
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>

      <!-- Conteúdo Principal -->
      <main class="help-content">
        <!-- Resultados de Busca -->
        <div v-if="helpState.searchQuery" class="search-results">
          <div class="results-header">
            <h2>Resultados da busca para "{{ helpState.searchQuery }}"</h2>
            <span class="results-count">{{ filteredSections.length }} resultado(s)</span>
          </div>
          
          <div v-if="filteredSections.length === 0" class="no-results">
            <Icon name="search" class="no-results-icon" />
            <h3>Nenhum resultado encontrado</h3>
            <p>Tente usar palavras-chave diferentes ou verifique a ortografia.</p>
          </div>
          
          <div v-else class="results-list">
            <div 
              v-for="section in filteredSections" 
              :key="`${section.moduleId}-${section.id}`"
              class="result-item"
              @click="setCurrentSection(section.id)"
            >
              <div class="result-header">
                <h3 class="result-title">{{ section.title }}</h3>
                <span class="result-module">{{ section.moduleTitle }}</span>
              </div>
              <p class="result-excerpt">{{ getContentExcerpt(section.content) }}</p>
            </div>
          </div>
        </div>

        <!-- Página Inicial (sem busca e sem seção selecionada) -->
        <div v-else-if="!helpState.currentSection" class="help-home">
          <div class="welcome-section">
            <h2>Bem-vindo à Central de Ajuda!</h2>
            <p>Aqui você encontra tudo que precisa para usar o UpKeep Pró de forma eficiente.</p>
          </div>

          <!-- Cards dos Módulos -->
          <div class="modules-grid">
            <div 
              v-for="(module, moduleId) in helpDatabase" 
              :key="moduleId"
              class="module-card"
              @click="setCurrentSection(module.sections[0].id)"
            >
              <div class="card-header">
                <Icon :name="module.icon" class="card-icon" />
                <h3 class="card-title">{{ module.title }}</h3>
              </div>
              <p class="card-description">{{ module.description }}</p>
              <div class="card-stats">
                <span class="stat">{{ module.sections.length }} artigo(s)</span>
                <span class="stat">{{ getModuleProgress(moduleId) }}% concluído</span>
              </div>
              <div class="card-progress">
                <div 
                  class="progress-fill"
                  :style="{ width: `${getModuleProgress(moduleId)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Ações Rápidas -->
          <div class="quick-actions">
            <h3>Ações Rápidas</h3>
            <div class="actions-grid">
              <button class="action-button" @click="setCurrentSection('criar-solicitacao')">
                <Icon name="plus" />
                Como criar solicitações
              </button>
              <button class="action-button" @click="setCurrentSection('gerar-relatorio')">
                <Icon name="bar-chart" />
                Gerar relatórios
              </button>
              <button class="action-button" @click="setCurrentSection('executar-ordem')">
                <Icon name="tool" />
                Executar ordens de serviço
              </button>
              <button class="action-button" @click="setCurrentSection('personalizar-perfil')">
                <Icon name="user" />
                Configurar perfil
              </button>
            </div>
          </div>
        </div>

        <!-- Conteúdo da Seção Selecionada -->
        <div v-else-if="currentSectionData" class="section-content">
          <HelpContentViewer 
            :section="currentSectionData"
            :module="currentModule"
            @toggle-favorite="toggleFavorite"
            @show-related="setCurrentSection"
          />
        </div>
      </main>
    </div>
    
    <!-- Tutorials Tab -->
    <div v-show="activeTab === 'tutorials'" class="tutorials-tab">
      <TutorialManager />
    </div>
    
    <!-- FAQ Tab -->
    <div v-show="activeTab === 'faq'" class="faq-tab">
      <div class="faq-container">
        <div class="faq-header">
          <h2>
            <Icon name="help-circle" />
            Perguntas Frequentes
          </h2>
          <p>Respostas rápidas para as dúvidas mais comuns</p>
        </div>
        
        <div class="faq-categories">
          <div 
            v-for="category in faqCategories" 
            :key="category.id"
            class="faq-category"
          >
            <h3 class="category-title">
              <Icon :name="category.icon" />
              {{ category.title }}
            </h3>
            
            <div class="faq-items">
              <div 
                v-for="faq in category.items" 
                :key="faq.id"
                class="faq-item"
              >
                <button 
                  @click="toggleFAQ(faq.id)"
                  :class="['faq-question', { active: activeFAQ === faq.id }]"
                >
                  <span>{{ faq.question }}</span>
                  <Icon :name="activeFAQ === faq.id ? 'chevron-up' : 'chevron-down'" />
                </button>
                
                <div 
                  v-show="activeFAQ === faq.id" 
                  class="faq-answer"
                  v-html="faq.answer"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Ajuda Contextual -->
    <HelpModal 
      v-if="helpState.showContextualHelp"
      :content="helpState.contextualContent"
      @close="hideContextualHelp"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import useHelp from '@/composables/useHelp'
import Icon from '@/components/Icon.vue'
import HelpContentViewer from '@/components/help/HelpContentViewer.vue'
import HelpModal from '@/components/help/HelpModal.vue'
import TutorialManager from '@/components/help/TutorialManager.vue'

// Reactive state
const activeTab = ref('documentation')
const activeFAQ = ref(null)

// Composables
const {
  helpState,
  helpDatabase,
  filteredSections,
  currentModule,
  currentSectionData,
  setCurrentSection,
  toggleFavorite,
  searchHelp,
  clearSearch,
  hideContextualHelp,
  getModuleProgress
} = useHelp()

// FAQ data
const faqCategories = ref([
  {
    id: 'general',
    title: 'Geral',
    icon: 'help-circle',
    items: [
      {
        id: 'what-is-upkeep',
        question: 'O que é o UpKeep Pró?',
        answer: '<p>O UpKeep Pró é um sistema completo de gestão de manutenção que permite controlar solicitações, ordens de serviço, ativos, estoque e relatórios de forma integrada.</p>'
      },
      {
        id: 'first-steps',
        question: 'Como começar a usar o sistema?',
        answer: '<p>Recomendamos começar com o tutorial de boas-vindas. Vá até a aba "Tutoriais" e execute o "Tour para Novos Usuários".</p><p>Em seguida, explore os módulos principais: Dashboard, Solicitações e Ordens de Serviço.</p>'
      },
      {
        id: 'user-roles',
        question: 'Quais são os tipos de usuário?',
        answer: '<p>O sistema possui diferentes perfis:</p><ul><li><strong>Administrador:</strong> Acesso total ao sistema</li><li><strong>Gerente:</strong> Gestão de equipes e relatórios</li><li><strong>Técnico:</strong> Execução de ordens de serviço</li><li><strong>Solicitante:</strong> Criação de solicitações</li></ul>'
      }
    ]
  },
  {
    id: 'solicitacoes',
    title: 'Solicitações',
    icon: 'clipboard-list',
    items: [
      {
        id: 'create-request',
        question: 'Como criar uma solicitação?',
        answer: '<p>Para criar uma nova solicitação:</p><ol><li>Acesse o módulo "Solicitações"</li><li>Clique em "Nova Solicitação"</li><li>Preencha o título e descrição</li><li>Selecione prioridade e setor</li><li>Adicione fotos se necessário</li><li>Clique em "Enviar"</li></ol>'
      },
      {
        id: 'request-status',
        question: 'Quais são os status de uma solicitação?',
        answer: '<p>Uma solicitação pode ter os seguintes status:</p><ul><li><strong>Pendente:</strong> Aguardando análise</li><li><strong>Aprovada:</strong> Aprovada para execução</li><li><strong>Em Andamento:</strong> Sendo executada</li><li><strong>Concluída:</strong> Finalizada</li><li><strong>Rejeitada:</strong> Não aprovada</li></ul>'
      },
      {
        id: 'urgent-requests',
        question: 'Como marcar uma solicitação como urgente?',
        answer: '<p>No formulário de criação, selecione "Urgente" no campo "Prioridade". Solicitações urgentes são destacadas na lista e notificam os responsáveis imediatamente.</p>'
      }
    ]
  },
  {
    id: 'ordens',
    title: 'Ordens de Serviço',
    icon: 'wrench',
    items: [
      {
        id: 'ordem-creation',
        question: 'Como são criadas as ordens de serviço?',
        answer: '<p>As ordens são criadas automaticamente quando uma solicitação é aprovada. Você também pode criar ordens diretamente para manutenções preventivas.</p>'
      },
      {
        id: 'assign-technician',
        question: 'Como atribuir um técnico à ordem?',
        answer: '<p>Na visualização da ordem:</p><ol><li>Clique em "Editar"</li><li>No campo "Técnico Responsável", selecione o técnico</li><li>Salve as alterações</li></ol><p>O técnico receberá uma notificação da atribuição.</p>'
      },
      {
        id: 'ordem-materials',
        question: 'Como adicionar materiais a uma ordem?',
        answer: '<p>Na seção "Materiais e Ferramentas" da ordem:</p><ol><li>Clique em "Adicionar Material"</li><li>Selecione o item do estoque</li><li>Informe a quantidade</li><li>Confirme a adição</li></ol><p>O sistema verificará a disponibilidade no estoque.</p>'
      }
    ]
  },
  {
    id: 'reports',
    title: 'Relatórios',
    icon: 'bar-chart-3',
    items: [
      {
        id: 'generate-report',
        question: 'Como gerar um relatório?',
        answer: '<p>No módulo "Relatórios":</p><ol><li>Selecione o tipo de relatório</li><li>Configure os filtros (período, setor, etc.)</li><li>Clique em "Gerar Relatório"</li><li>Aguarde o processamento</li><li>Faça o download ou visualize online</li></ol>'
      },
      {
        id: 'schedule-reports',
        question: 'Posso agendar relatórios automáticos?',
        answer: '<p>Sim! Na configuração do relatório, marque "Envio Automático" e configure:</p><ul><li>Frequência (diária, semanal, mensal)</li><li>Horário de envio</li><li>Destinatários por email</li></ul>'
      }
    ]
  },
  {
    id: 'technical',
    title: 'Problemas Técnicos',
    icon: 'settings',
    items: [
      {
        id: 'slow-system',
        question: 'O sistema está lento, o que fazer?',
        answer: '<p>Possíveis soluções:</p><ul><li>Limpe o cache do navegador</li><li>Verifique sua conexão com a internet</li><li>Feche outras abas desnecessárias</li><li>Tente acessar em modo privado</li></ul><p>Se o problema persistir, entre em contato com o suporte.</p>'
      },
      {
        id: 'login-issues',
        question: 'Não consigo fazer login',
        answer: '<p>Verifique:</p><ul><li>Se o email está correto</li><li>Se a senha está correta (caps lock ativo?)</li><li>Se sua conta não foi desativada</li></ul><p>Use "Esqueci minha senha" se necessário. Se ainda não conseguir, contate o administrador.</p>'
      },
      {
        id: 'file-upload',
        question: 'Erro ao enviar arquivos',
        answer: '<p>Possíveis causas:</p><ul><li>Arquivo muito grande (máximo 10MB)</li><li>Formato não suportado</li><li>Conexão instável</li></ul><p>Tente reduzir o tamanho do arquivo ou usar um formato diferente (JPG, PNG, PDF).</p>'
      }
    ]
  }
])

// Methods
function toggleFAQ(faqId) {
  if (activeFAQ.value === faqId) {
    activeFAQ.value = null
  } else {
    activeFAQ.value = faqId
  }
}

function getSectionIcon(sectionId) {
  const section = Object.values(helpDatabase.value)
    .flatMap(module => module.sections)
    .find(s => s.id === sectionId)
  
  if (!section) return 'help-circle'
  
  const module = Object.values(helpDatabase.value)
    .find(m => m.sections.includes(section))
  
  return module?.icon || 'help-circle'
}

function getSectionTitle(sectionId) {
  const section = Object.values(helpDatabase.value)
    .flatMap(module => module.sections)
    .find(s => s.id === sectionId)
  
  return section?.title || 'Seção não encontrada'
}

function getContentExcerpt(content) {
  // Remove HTML tags e pega os primeiros 150 caracteres
  const text = content.replace(/<[^>]*>/g, '').trim()
  return text.length > 150 ? text.slice(0, 150) + '...' : text
}

// Lifecycle
onMounted(() => {
  // Se não há seção atual, tentar restaurar da URL
  const urlParams = new URLSearchParams(window.location.search)
  const section = urlParams.get('section')
  if (section) {
    setCurrentSection(section)
  }
})
</script>

<style scoped>
.help-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.help-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 2rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-info {
  flex: 1;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 2.25rem;
  color: #3498db;
}

.header-subtitle {
  font-size: 1.1rem;
  color: #6c757d;
  margin: 0;
}

.search-container {
  flex: 0 0 400px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #6c757d;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.search-clear {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
}

.search-clear:hover {
  background: #f8f9fa;
}

.help-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  padding: 2rem;
  align-items: start;
}

.help-sidebar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.07);
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

.sidebar-content {
  padding: 1.5rem;
}

.nav-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.quick-nav {
  margin-bottom: 2rem;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  font-size: 0.875rem;
  color: #6c757d;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.875rem;
  color: #495057;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: #f8f9fa;
  color: #3498db;
}

.nav-link.active {
  background: #e3f2fd;
  color: #3498db;
  font-weight: 500;
}

.nav-icon {
  font-size: 0.875rem;
  flex-shrink: 0;
}

.module-section {
  margin-bottom: 2rem;
}

.module-header {
  margin-bottom: 0.75rem;
}

.module-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.module-icon {
  color: #3498db;
}

.module-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 2px;
  width: var(--progress, 0%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

.section-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.section-item {
  margin-bottom: 0.25rem;
}

.section-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.875rem;
  color: #495057;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.section-link:hover {
  background: #f8f9fa;
  color: #3498db;
}

.section-link.active {
  background: #e3f2fd;
  color: #3498db;
  font-weight: 500;
}

.viewed-icon {
  font-size: 0.75rem;
  color: #28a745;
  opacity: 0.7;
}

.help-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.07);
  min-height: 600px;
}

.search-results {
  padding: 2rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.results-header h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
}

.results-count {
  font-size: 0.875rem;
  color: #6c757d;
  background: #f8f9fa;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.no-results {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.result-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.result-module {
  font-size: 0.875rem;
  color: #6c757d;
  background: #f8f9fa;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  flex-shrink: 0;
}

.result-excerpt {
  color: #495057;
  line-height: 1.6;
  margin: 0;
}

.help-home {
  padding: 2rem;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.welcome-section p {
  font-size: 1.1rem;
  color: #6c757d;
  margin: 0;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.module-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  border-color: #3498db;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-icon {
  font-size: 2rem;
  color: #3498db;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.card-description {
  color: #6c757d;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.stat {
  font-size: 0.875rem;
  color: #495057;
}

.card-progress {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.quick-actions h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.action-button:hover {
  border-color: #3498db;
  color: #3498db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.section-content {
  padding: 0;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .search-container {
    flex: none;
    width: 100%;
  }
  
  .help-layout {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
  
  .help-sidebar {
    position: static;
    max-height: none;
  }
  
  .modules-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
}

/* Navigation Tabs */
.help-tabs {
  display: flex;
  background: white;
  border-bottom: 2px solid #e9ecef;
  padding: 0 2rem;
  gap: 0.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6c757d;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.tab-btn:hover {
  color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.tab-btn.active {
  color: #3498db;
  border-bottom-color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

/* Tutorials Tab */
.tutorials-tab {
  background: #f8f9fa;
  min-height: calc(100vh - 200px);
}

/* FAQ Tab */
.faq-tab {
  background: #f8f9fa;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.faq-container {
  max-width: 1000px;
  margin: 0 auto;
}

.faq-header {
  text-align: center;
  margin-bottom: 2rem;
}

.faq-header h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.faq-header p {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
}

.faq-categories {
  display: grid;
  gap: 2rem;
}

.faq-category {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e9ecef;
}

.faq-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.faq-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.faq-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: white;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  color: #2c3e50;
}

.faq-question:hover {
  background: #f8f9fa;
}

.faq-question.active {
  background: #3498db;
  color: white;
}

.faq-answer {
  padding: 1.25rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  color: #495057;
  line-height: 1.6;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.faq-answer h3 {
  color: #2c3e50;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.faq-answer ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.faq-answer ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.faq-answer li {
  margin-bottom: 0.25rem;
}

.faq-answer strong {
  color: #2c3e50;
}

/* Mobile responsiveness for tabs */
@media (max-width: 768px) {
  .help-tabs {
    padding: 0 1rem;
    overflow-x: auto;
  }
  
  .tab-btn {
    white-space: nowrap;
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }
  
  .faq-tab {
    padding: 1rem;
  }
  
  .faq-header h2 {
    font-size: 1.5rem;
  }
  
  .category-title {
    font-size: 1.1rem;
  }
  
  .faq-question {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .faq-answer {
    padding: 1rem;
    font-size: 0.9rem;
  }
}
</style>