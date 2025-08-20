<template>
  <div class="content-viewer">
    <!-- Header da Seção -->
    <div class="content-header">
      <div class="header-main">
        <div class="breadcrumb">
          <span class="breadcrumb-item">{{ module.title }}</span>
          <Icon name="chevron-right" class="breadcrumb-separator" />
          <span class="breadcrumb-current">{{ section.title }}</span>
        </div>
        
        <h1 class="content-title">{{ section.title }}</h1>
        
        <div class="content-actions">
          <button
            @click="toggleFavorite"
            :class="['action-btn', 'favorite-btn', { active: isFavorite }]"
            :title="isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
          >
            <Icon :name="isFavorite ? 'heart-filled' : 'heart'" />
            {{ isFavorite ? 'Favoritado' : 'Favoritar' }}
          </button>
          
          <button
            @click="shareSection"
            class="action-btn share-btn"
            title="Compartilhar link desta seção"
          >
            <Icon name="share" />
            Compartilhar
          </button>
          
          <button
            @click="printSection"
            class="action-btn print-btn"
            title="Imprimir esta seção"
          >
            <Icon name="printer" />
            Imprimir
          </button>
        </div>
      </div>
    </div>

    <!-- Conteúdo Principal -->
    <div class="content-body">
      <div class="main-content">
        <!-- Conteúdo HTML -->
        <div class="content-html" v-html="section.content"></div>

        <!-- Exemplos -->
        <div v-if="section.examples?.length" class="examples-section">
          <h3 class="section-subtitle">
            <Icon name="code" />
            Exemplos Práticos
          </h3>
          
          <div class="examples-grid">
            <div 
              v-for="(example, index) in section.examples" 
              :key="index"
              class="example-card"
            >
              <div class="example-header">
                <h4 class="example-title">{{ example.title }}</h4>
                <button
                  @click="copyCode(example.code)"
                  class="copy-btn"
                  title="Copiar código"
                >
                  <Icon name="copy" />
                </button>
              </div>
              
              <p class="example-description">{{ example.description }}</p>
              
              <div class="code-block">
                <pre><code>{{ example.code }}</code></pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Dicas -->
        <div v-if="section.tips?.length" class="tips-section">
          <h3 class="section-subtitle">
            <Icon name="lightbulb" />
            Dicas Importantes
          </h3>
          
          <div class="tips-list">
            <div 
              v-for="(tip, index) in section.tips" 
              :key="index"
              class="tip-item"
            >
              <Icon name="check-circle" class="tip-icon" />
              <span class="tip-text">{{ tip }}</span>
            </div>
          </div>
        </div>

        <!-- Solução de Problemas -->
        <div v-if="section.troubleshooting?.length" class="troubleshooting-section">
          <h3 class="section-subtitle">
            <Icon name="alert-triangle" />
            Solução de Problemas
          </h3>
          
          <div class="troubleshooting-list">
            <details 
              v-for="(item, index) in section.troubleshooting" 
              :key="index"
              class="trouble-item"
            >
              <summary class="trouble-problem">
                <Icon name="help-circle" class="trouble-icon" />
                {{ item.problem }}
              </summary>
              <div class="trouble-solution">
                <strong>Solução:</strong> {{ item.solution }}
              </div>
            </details>
          </div>
        </div>

        <!-- Vídeos Tutorial (se houver) -->
        <div v-if="section.videos?.length" class="videos-section">
          <h3 class="section-subtitle">
            <Icon name="play-circle" />
            Vídeos Tutorial
          </h3>
          
          <div class="videos-grid">
            <div 
              v-for="(video, index) in section.videos" 
              :key="index"
              class="video-card"
            >
              <div class="video-thumbnail">
                <img :src="video.thumbnail" :alt="video.title" />
                <button class="play-button" @click="playVideo(video)">
                  <Icon name="play" />
                </button>
              </div>
              <div class="video-info">
                <h4 class="video-title">{{ video.title }}</h4>
                <p class="video-description">{{ video.description }}</p>
                <span class="video-duration">{{ video.duration }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar com Navegação -->
      <aside class="content-sidebar">
        <!-- Índice da Seção -->
        <div class="sidebar-section">
          <h4 class="sidebar-title">Nesta Seção</h4>
          <nav class="section-nav">
            <a 
              v-for="heading in sectionHeadings" 
              :key="heading.id"
              :href="`#${heading.id}`"
              class="nav-item"
              @click="scrollToHeading(heading.id)"
            >
              {{ heading.text }}
            </a>
          </nav>
        </div>

        <!-- Páginas Relacionadas -->
        <div v-if="section.relatedPages?.length" class="sidebar-section">
          <h4 class="sidebar-title">Páginas Relacionadas</h4>
          <div class="related-pages">
            <button
              v-for="pageId in section.relatedPages" 
              :key="pageId"
              class="related-page"
              @click="$emit('show-related', pageId)"
            >
              <Icon :name="getPageIcon(pageId)" class="related-icon" />
              {{ getPageTitle(pageId) }}
            </button>
          </div>
        </div>

        <!-- Avaliação da Página -->
        <div class="sidebar-section">
          <h4 class="sidebar-title">Esta página foi útil?</h4>
          <div class="rating-section">
            <div class="rating-buttons">
              <button
                @click="rateSection(true)"
                :class="['rating-btn', { active: userRating === true }]"
              >
                <Icon name="thumbs-up" />
                Sim
              </button>
              <button
                @click="rateSection(false)"
                :class="['rating-btn', { active: userRating === false }]"
              >
                <Icon name="thumbs-down" />
                Não
              </button>
            </div>
            
            <div v-if="userRating !== null" class="feedback-form">
              <textarea
                v-model="feedbackText"
                placeholder="Conte-nos como podemos melhorar esta página..."
                class="feedback-textarea"
                rows="3"
              ></textarea>
              <button @click="submitFeedback" class="submit-feedback-btn">
                Enviar Feedback
              </button>
            </div>
          </div>
        </div>

        <!-- Última Atualização -->
        <div class="sidebar-section">
          <div class="last-updated">
            <Icon name="clock" class="update-icon" />
            <span class="update-text">
              Atualizado em {{ formatDate(section.lastUpdated || new Date()) }}
            </span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Navigation Footer -->
    <div class="content-footer">
      <div class="nav-buttons">
        <button
          v-if="previousSection"
          @click="$emit('show-related', previousSection.id)"
          class="nav-btn prev-btn"
        >
          <Icon name="chevron-left" />
          <div class="nav-info">
            <span class="nav-label">Anterior</span>
            <span class="nav-title">{{ previousSection.title }}</span>
          </div>
        </button>
        
        <button
          v-if="nextSection"
          @click="$emit('show-related', nextSection.id)"
          class="nav-btn next-btn"
        >
          <div class="nav-info">
            <span class="nav-label">Próximo</span>
            <span class="nav-title">{{ nextSection.title }}</span>
          </div>
          <Icon name="chevron-right" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import useHelp from '@/composables/useHelp'
import Icon from '@/components/Icon.vue'

// Props
const props = defineProps({
  section: {
    type: Object,
    required: true
  },
  module: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['toggle-favorite', 'show-related'])

// Composables
const { isFavorite: checkFavorite } = useHelp()

// Estado local
const userRating = ref(null)
const feedbackText = ref('')
const sectionHeadings = ref([])

// Computed
const isFavorite = computed(() => checkFavorite(props.section.id))

const previousSection = computed(() => {
  const currentIndex = props.module.sections.findIndex(s => s.id === props.section.id)
  return currentIndex > 0 ? props.module.sections[currentIndex - 1] : null
})

const nextSection = computed(() => {
  const currentIndex = props.module.sections.findIndex(s => s.id === props.section.id)
  return currentIndex < props.module.sections.length - 1 ? props.module.sections[currentIndex + 1] : null
})

// Methods
function toggleFavorite() {
  emit('toggle-favorite', props.section.id)
}

function shareSection() {
  const url = `${window.location.origin}/help?section=${props.section.id}`
  if (navigator.share) {
    navigator.share({
      title: props.section.title,
      text: `Confira esta documentação: ${props.section.title}`,
      url: url
    })
  } else {
    navigator.clipboard.writeText(url)
    // TODO: Mostrar toast de sucesso
  }
}

function printSection() {
  window.print()
}

function copyCode(code) {
  navigator.clipboard.writeText(code)
  // TODO: Mostrar toast de sucesso
}

function scrollToHeading(headingId) {
  const element = document.getElementById(headingId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

function rateSection(isPositive) {
  userRating.value = isPositive
}

function submitFeedback() {
  // TODO: Implementar envio de feedback
  console.log('Feedback:', {
    sectionId: props.section.id,
    rating: userRating.value,
    text: feedbackText.value
  })
  
  // Reset form
  feedbackText.value = ''
  // TODO: Mostrar toast de sucesso
}

function getPageIcon(pageId) {
  const icons = {
    'solicitacoes': 'file-text',
    'ordens-servico': 'tool',
    'usuarios': 'users',
    'dashboard': 'dashboard',
    'relatorios': 'bar-chart'
  }
  return icons[pageId] || 'help-circle'
}

function getPageTitle(pageId) {
  const titles = {
    'solicitacoes': 'Solicitações',
    'ordens-servico': 'Ordens de Serviço',
    'usuarios': 'Usuários',
    'dashboard': 'Dashboard',
    'relatorios': 'Relatórios'
  }
  return titles[pageId] || 'Página'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR')
}

function playVideo(video) {
  // TODO: Implementar player de vídeo
  console.log('Play video:', video)
}

function extractHeadings() {
  nextTick(() => {
    const content = document.querySelector('.content-html')
    if (!content) return
    
    const headings = content.querySelectorAll('h3, h4, h5')
    sectionHeadings.value = Array.from(headings).map(heading => ({
      id: heading.id || `heading-${Math.random().toString(36).substr(2, 9)}`,
      text: heading.textContent.trim()
    }))
    
    // Adicionar IDs aos headings que não têm
    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = sectionHeadings.value[index].id
      }
    })
  })
}

// Lifecycle
onMounted(() => {
  extractHeadings()
  
  // Carregar avaliação salva
  const savedRating = localStorage.getItem(`help-rating-${props.section.id}`)
  if (savedRating) {
    userRating.value = JSON.parse(savedRating)
  }
})
</script>

<style scoped>
.content-viewer {
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

.content-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
  padding: 2rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.breadcrumb-separator {
  font-size: 0.75rem;
}

.breadcrumb-current {
  color: #3498db;
  font-weight: 500;
}

.content-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
}

.content-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.favorite-btn.active {
  background: #3498db;
  border-color: #3498db;
  color: white;
}

.content-body {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  padding: 2rem;
  flex: 1;
}

.main-content {
  max-width: none;
}

.content-html {
  font-size: 1rem;
  line-height: 1.7;
  color: #495057;
}

.content-html h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 2rem 0 1rem 0;
}

.content-html h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 1.5rem 0 0.75rem 0;
}

.content-html ul, .content-html ol {
  margin: 1rem 0;
  padding-left: 2rem;
}

.content-html li {
  margin-bottom: 0.5rem;
}

.content-html p {
  margin: 1rem 0;
}

.section-subtitle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 2.5rem 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.examples-section {
  margin: 2rem 0;
}

.examples-grid {
  display: grid;
  gap: 1.5rem;
}

.example-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.example-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.copy-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
}

.copy-btn:hover {
  background: #e9ecef;
  color: #3498db;
}

.example-description {
  color: #6c757d;
  margin: 0 0 1rem 0;
}

.code-block {
  background: #2c3e50;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  color: #ecf0f1;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.tips-section {
  margin: 2rem 0;
}

.tips-list {
  display: grid;
  gap: 1rem;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #e8f5e8;
  border: 1px solid #d4edda;
  border-radius: 6px;
}

.tip-icon {
  color: #28a745;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.tip-text {
  color: #155724;
  line-height: 1.6;
}

.troubleshooting-section {
  margin: 2rem 0;
}

.troubleshooting-list {
  display: grid;
  gap: 1rem;
}

.trouble-item {
  border: 1px solid #f0ad4e;
  border-radius: 6px;
  background: #fff3cd;
}

.trouble-problem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  font-weight: 500;
  color: #856404;
}

.trouble-icon {
  color: #f0ad4e;
  flex-shrink: 0;
}

.trouble-solution {
  padding: 0 1rem 1rem 1rem;
  color: #856404;
  border-top: 1px solid #f0ad4e;
  background: #fcf8e3;
}

.content-sidebar {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.sidebar-section {
  margin-bottom: 2rem;
}

.sidebar-section:last-child {
  margin-bottom: 0;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.section-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: block;
  padding: 0.5rem 0.75rem;
  color: #6c757d;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: white;
  color: #3498db;
}

.related-pages {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.related-page {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.related-page:hover {
  border-color: #3498db;
  color: #3498db;
}

.related-icon {
  color: #6c757d;
  flex-shrink: 0;
}

.rating-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rating-buttons {
  display: flex;
  gap: 0.5rem;
}

.rating-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
}

.rating-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.rating-btn.active {
  background: #3498db;
  border-color: #3498db;
  color: white;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feedback-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.submit-feedback-btn {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.submit-feedback-btn:hover {
  background: #2980b9;
}

.last-updated {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.update-icon {
  color: #6c757d;
  font-size: 0.875rem;
}

.update-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.content-footer {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 2rem;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  max-width: 800px;
  margin: 0 auto;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.nav-btn:hover {
  border-color: #3498db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.nav-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.nav-title {
  font-weight: 600;
  color: #2c3e50;
}

.prev-btn {
  margin-right: auto;
}

.next-btn {
  margin-left: auto;
}

@media (max-width: 768px) {
  .content-body {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
  
  .content-sidebar {
    position: static;
    order: -1;
  }
  
  .content-actions {
    justify-content: center;
  }
  
  .nav-buttons {
    flex-direction: column;
    gap: 1rem;
  }
  
  .prev-btn,
  .next-btn {
    margin: 0;
  }
}
</style>