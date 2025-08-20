<template>
  <div class="tutorial-manager">
    <!-- Header -->
    <div class="manager-header">
      <h2>
        <Icon name="graduation-cap" />
        Tours e Tutoriais
      </h2>
      <p class="header-description">
        Aprenda a usar o sistema com nossos tutoriais interativos
      </p>
    </div>
    
    <!-- Progresso Geral -->
    <div class="progress-overview">
      <div class="progress-card">
        <div class="progress-info">
          <h3>Seu Progresso</h3>
          <div class="progress-stats">
            <span class="completed">{{ completedCount }}</span>
            <span class="separator">/</span>
            <span class="total">{{ totalTutorials }}</span>
            <span class="label">tutoriais</span>
          </div>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="progress-percentage">{{ Math.round(progressPercentage) }}% concluído</div>
      </div>
    </div>
    
    <!-- Recomendação -->
    <div v-if="recommendedTutorial" class="recommended-section">
      <h3>
        <Icon name="star" />
        Recomendado para Você
      </h3>
      <div class="recommended-card">
        <div class="tutorial-info">
          <h4>{{ recommendedTutorial.title }}</h4>
          <p>{{ recommendedTutorial.description }}</p>
          <div class="tutorial-meta">
            <span class="duration">
              <Icon name="clock" />
              {{ recommendedTutorial.duration }}
            </span>
            <span class="category">
              <Icon name="tag" />
              {{ recommendedTutorial.category }}
            </span>
          </div>
        </div>
        <div class="tutorial-actions">
          <button 
            @click="startTutorial(recommendedTutorial.id)"
            class="start-btn recommended"
          >
            <Icon name="play" />
            Começar Agora
          </button>
        </div>
      </div>
    </div>
    
    <!-- Filtros -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Categoria:</label>
        <select v-model="selectedCategory" class="filter-select">
          <option value="">Todas</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ formatCategory(category) }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="selectedStatus" class="filter-select">
          <option value="">Todos</option>
          <option value="available">Disponíveis</option>
          <option value="completed">Concluídos</option>
          <option value="locked">Bloqueados</option>
        </select>
      </div>
      
      <div class="filter-group">
        <button @click="resetFilters" class="reset-btn">
          <Icon name="refresh-cw" />
          Limpar Filtros
        </button>
      </div>
    </div>
    
    <!-- Lista de Tutoriais -->
    <div class="tutorials-grid">
      <div
        v-for="tutorial in filteredTutorials"
        :key="tutorial.id"
        :class="['tutorial-card', {
          completed: isCompleted(tutorial.id),
          locked: isLocked(tutorial.id),
          recommended: tutorial.id === recommendedTutorial?.id
        }]"
      >
        <!-- Status Badge -->
        <div class="status-badge">
          <Icon 
            v-if="isCompleted(tutorial.id)" 
            name="check-circle" 
            class="completed-icon"
          />
          <Icon 
            v-else-if="isLocked(tutorial.id)" 
            name="lock" 
            class="locked-icon"
          />
          <Icon 
            v-else-if="tutorial.id === recommendedTutorial?.id" 
            name="star" 
            class="recommended-icon"
          />
          <Icon 
            v-else
            name="play-circle" 
            class="available-icon"
          />
        </div>
        
        <!-- Content -->
        <div class="card-content">
          <h4 class="tutorial-title">{{ tutorial.title }}</h4>
          <p class="tutorial-description">{{ tutorial.description }}</p>
          
          <div class="tutorial-meta">
            <span class="duration">
              <Icon name="clock" />
              {{ tutorial.duration }}
            </span>
            <span class="category">
              <Icon name="tag" />
              {{ formatCategory(tutorial.category) }}
            </span>
          </div>
          
          <!-- Pré-requisitos -->
          <div v-if="tutorial.prerequisites?.length" class="prerequisites">
            <span class="prereq-label">Requer:</span>
            <div class="prereq-list">
              <span
                v-for="prereqId in tutorial.prerequisites"
                :key="prereqId"
                :class="['prereq-item', {
                  completed: isCompleted(prereqId)
                }]"
              >
                {{ getPrereqTitle(prereqId) }}
                <Icon 
                  :name="isCompleted(prereqId) ? 'check' : 'x'" 
                  class="prereq-status"
                />
              </span>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="card-actions">
          <button
            v-if="!isLocked(tutorial.id) && !isCompleted(tutorial.id)"
            @click="startTutorial(tutorial.id)"
            class="start-btn"
          >
            <Icon name="play" />
            Iniciar
          </button>
          
          <button
            v-if="isCompleted(tutorial.id)"
            @click="resetTutorial(tutorial.id)"
            class="restart-btn"
          >
            <Icon name="refresh-cw" />
            Refazer
          </button>
          
          <button
            v-if="isLocked(tutorial.id)"
            @click="showPrerequisites(tutorial)"
            class="info-btn"
            disabled
          >
            <Icon name="info" />
            Bloqueado
          </button>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="filteredTutorials.length === 0" class="empty-state">
      <Icon name="search" size="48" />
      <h3>Nenhum tutorial encontrado</h3>
      <p>Tente alterar os filtros ou verifique novamente mais tarde.</p>
      <button @click="resetFilters" class="reset-btn">
        Limpar Filtros
      </button>
    </div>
    
    <!-- Tutorial Component -->
    <TutorialGuide
      ref="tutorialGuide"
      :steps="currentTutorialSteps"
      :tutorial-id="currentTutorialId"
      @complete="handleTutorialComplete"
      @skip="handleTutorialSkip"
      @close="handleTutorialClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Icon from '@/components/Icon.vue'
import TutorialGuide from './TutorialGuide.vue'
import useHelp from '@/composables/useHelp'

// Composables
const {
  helpState,
  tutorialDatabase,
  getAllTutorials,
  getTutorialsByCategory,
  getAvailableTutorials,
  getNextRecommendedTutorial,
  startTutorial: startTutorialComposable,
  completeTutorial,
  skipTutorial,
  resetTutorial: resetTutorialComposable
} = useHelp()

// Refs
const tutorialGuide = ref(null)
const selectedCategory = ref('')
const selectedStatus = ref('')
const currentTutorialId = ref('')
const currentTutorialSteps = ref([])

// Computed
const allTutorials = computed(() => Object.values(getAllTutorials()))

const categories = computed(() => {
  const cats = [...new Set(allTutorials.value.map(t => t.category))]
  return cats.sort()
})

const filteredTutorials = computed(() => {
  let tutorials = allTutorials.value
  
  // Filtrar por categoria
  if (selectedCategory.value) {
    tutorials = tutorials.filter(t => t.category === selectedCategory.value)
  }
  
  // Filtrar por status
  if (selectedStatus.value) {
    tutorials = tutorials.filter(t => {
      switch (selectedStatus.value) {
        case 'available':
          return !isLocked(t.id) && !isCompleted(t.id)
        case 'completed':
          return isCompleted(t.id)
        case 'locked':
          return isLocked(t.id)
        default:
          return true
      }
    })
  }
  
  return tutorials.sort((a, b) => {
    // Colocar recomendado primeiro
    if (a.id === recommendedTutorial.value?.id) return -1
    if (b.id === recommendedTutorial.value?.id) return 1
    
    // Depois disponíveis
    const aLocked = isLocked(a.id)
    const bLocked = isLocked(b.id)
    if (aLocked !== bLocked) return aLocked ? 1 : -1
    
    // Por fim, ordem alfabética
    return a.title.localeCompare(b.title)
  })
})

const completedCount = computed(() => {
  return helpState.completedTutorials.length
})

const totalTutorials = computed(() => {
  return allTutorials.value.length
})

const progressPercentage = computed(() => {
  if (totalTutorials.value === 0) return 0
  return (completedCount.value / totalTutorials.value) * 100
})

const recommendedTutorial = computed(() => {
  return getNextRecommendedTutorial()
})

// Methods
function isCompleted(tutorialId) {
  return helpState.completedTutorials.includes(tutorialId)
}

function isLocked(tutorialId) {
  const tutorial = tutorialDatabase.value[tutorialId]
  if (!tutorial) return true
  
  return tutorial.prerequisites.some(prereq => 
    !helpState.completedTutorials.includes(prereq)
  )
}

function formatCategory(category) {
  const categoryMap = {
    'introdução': 'Introdução',
    'solicitações': 'Solicitações',
    'ordens': 'Ordens de Serviço',
    'relatórios': 'Relatórios',
    'configuração': 'Configuração',
    'avançado': 'Avançado'
  }
  return categoryMap[category] || category
}

function getPrereqTitle(prereqId) {
  const tutorial = tutorialDatabase.value[prereqId]
  return tutorial?.title || prereqId
}

function startTutorial(tutorialId) {
  const tutorial = tutorialDatabase.value[tutorialId]
  if (!tutorial) return
  
  if (startTutorialComposable(tutorialId)) {
    currentTutorialId.value = tutorialId
    currentTutorialSteps.value = tutorial.steps
    tutorialGuide.value?.start()
  }
}

function resetTutorial(tutorialId) {
  resetTutorialComposable(tutorialId)
}

function resetFilters() {
  selectedCategory.value = ''
  selectedStatus.value = ''
}

function showPrerequisites(tutorial) {
  const prereqTitles = tutorial.prerequisites.map(getPrereqTitle).join(', ')
  alert(`Este tutorial requer a conclusão de: ${prereqTitles}`)
}

function handleTutorialComplete(tutorialId) {
  completeTutorial(tutorialId)
  currentTutorialId.value = ''
  currentTutorialSteps.value = []
}

function handleTutorialSkip(tutorialId) {
  skipTutorial(tutorialId)
  currentTutorialId.value = ''
  currentTutorialSteps.value = []
}

function handleTutorialClose() {
  currentTutorialId.value = ''
  currentTutorialSteps.value = []
}

// Lifecycle
onMounted(() => {
  // Auto-start primeiro tutorial se configurado
  const recommended = recommendedTutorial.value
  if (recommended && recommended.autoStart && helpState.tutorialPreferences.autoStart) {
    // Pequeno delay para evitar conflitos com a montagem
    setTimeout(() => {
      startTutorial(recommended.id)
    }, 1000)
  }
})
</script>

<style scoped>
.tutorial-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.manager-header {
  text-align: center;
  margin-bottom: 2rem;
}

.manager-header h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.header-description {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
}

.progress-overview {
  margin-bottom: 2rem;
}

.progress-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
}

.progress-info h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  opacity: 0.9;
}

.progress-stats {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.progress-stats .completed {
  font-size: 2.5rem;
  font-weight: bold;
}

.progress-stats .separator {
  font-size: 1.5rem;
  opacity: 0.7;
}

.progress-stats .total {
  font-size: 1.5rem;
  opacity: 0.8;
}

.progress-stats .label {
  font-size: 1rem;
  opacity: 0.7;
  margin-left: 0.5rem;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.2);
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  background: white;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-percentage {
  font-size: 0.875rem;
  opacity: 0.8;
}

.recommended-section {
  margin-bottom: 2rem;
}

.recommended-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f39c12;
  margin-bottom: 1rem;
}

.recommended-card {
  display: flex;
  background: white;
  border: 2px solid #f39c12;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.1);
}

.tutorial-info {
  flex: 1;
}

.tutorial-info h4 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.tutorial-info p {
  color: #6c757d;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.tutorial-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.tutorial-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tutorial-actions {
  display: flex;
  align-items: center;
}

.start-btn.recommended {
  background: #f39c12;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.start-btn.recommended:hover {
  background: #e67e22;
  transform: translateY(-1px);
}

.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  min-width: 120px;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #6c757d;
  border-radius: 4px;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: #6c757d;
  color: white;
}

.tutorials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.tutorial-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.tutorial-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
  transform: translateY(-2px);
}

.tutorial-card.completed {
  border-color: #27ae60;
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.05) 0%, rgba(39, 174, 96, 0.02) 100%);
}

.tutorial-card.locked {
  opacity: 0.6;
  border-color: #95a5a6;
}

.tutorial-card.recommended {
  border-color: #f39c12;
  background: linear-gradient(135deg, rgba(243, 156, 18, 0.05) 0%, rgba(243, 156, 18, 0.02) 100%);
}

.status-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.completed-icon {
  color: #27ae60;
}

.locked-icon {
  color: #95a5a6;
}

.recommended-icon {
  color: #f39c12;
}

.available-icon {
  color: #3498db;
}

.card-content {
  margin-right: 2rem;
}

.tutorial-title {
  color: #2c3e50;
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
}

.tutorial-description {
  color: #6c757d;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.prerequisites {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.prereq-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  display: block;
  margin-bottom: 0.5rem;
}

.prereq-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.prereq-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.75rem;
  border: 1px solid #e9ecef;
}

.prereq-item.completed {
  background: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.prereq-status {
  width: 12px;
  height: 12px;
}

.card-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.5rem;
}

.start-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.start-btn:hover {
  background: #2980b9;
}

.restart-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.restart-btn:hover {
  background: #229954;
}

.info-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: not-allowed;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.empty-state h3 {
  margin: 1rem 0;
  color: #495057;
}

.empty-state p {
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .tutorial-manager {
    padding: 1rem;
  }
  
  .recommended-card {
    flex-direction: column;
    gap: 1rem;
  }
  
  .tutorials-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    justify-content: space-between;
  }
  
  .card-content {
    margin-right: 0;
    margin-bottom: 2.5rem;
  }
  
  .status-badge {
    position: static;
    align-self: flex-end;
    margin-bottom: 1rem;
  }
}
</style>