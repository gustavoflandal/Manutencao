<template>
  <div v-if="isActive" class="tutorial-overlay">
    <!-- Spotlight / Highlight -->
    <div 
      v-if="currentStep.element"
      class="spotlight"
      :style="spotlightStyle"
    ></div>
    
    <!-- Tutorial Card -->
    <div 
      class="tutorial-card"
      :style="cardPosition"
    >
      <!-- Header -->
      <div class="tutorial-header">
        <div class="step-indicator">
          <span class="step-current">{{ currentStepIndex + 1 }}</span>
          <span class="step-separator">/</span>
          <span class="step-total">{{ steps.length }}</span>
        </div>
        
        <button @click="closeTutorial" class="close-btn">
          <Icon name="x" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="tutorial-content">
        <h3 class="tutorial-title">{{ currentStep.title }}</h3>
        <p class="tutorial-description">{{ currentStep.description }}</p>
        
        <!-- Media (se houver) -->
        <div v-if="currentStep.image" class="tutorial-media">
          <img :src="currentStep.image" :alt="currentStep.title" />
        </div>
        
        <div v-if="currentStep.video" class="tutorial-media">
          <video controls>
            <source :src="currentStep.video" type="video/mp4">
          </video>
        </div>
        
        <!-- Code example (se houver) -->
        <div v-if="currentStep.code" class="tutorial-code">
          <pre><code>{{ currentStep.code }}</code></pre>
        </div>
        
        <!-- Interactive actions -->
        <div v-if="currentStep.action" class="tutorial-action">
          <button 
            @click="executeAction(currentStep.action)"
            class="action-btn"
          >
            <Icon :name="currentStep.action.icon" />
            {{ currentStep.action.text }}
          </button>
        </div>
      </div>
      
      <!-- Navigation -->
      <div class="tutorial-navigation">
        <button
          v-if="currentStepIndex > 0"
          @click="previousStep"
          class="nav-btn prev-btn"
        >
          <Icon name="chevron-left" />
          Anterior
        </button>
        
        <div class="nav-indicators">
          <button
            v-for="(step, index) in steps"
            :key="index"
            @click="goToStep(index)"
            :class="['indicator', { active: index === currentStepIndex, completed: index < currentStepIndex }]"
          ></button>
        </div>
        
        <button
          v-if="currentStepIndex < steps.length - 1"
          @click="nextStep"
          class="nav-btn next-btn"
        >
          Próximo
          <Icon name="chevron-right" />
        </button>
        
        <button
          v-else
          @click="completeTutorial"
          class="nav-btn complete-btn"
        >
          Concluir
          <Icon name="check" />
        </button>
      </div>
      
      <!-- Options -->
      <div class="tutorial-options">
        <label class="option-checkbox">
          <input v-model="dontShowAgain" type="checkbox" />
          Não mostrar novamente
        </label>
        
        <button @click="skipTutorial" class="skip-btn">
          Pular tutorial
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import Icon from '@/components/Icon.vue'

// Props
const props = defineProps({
  steps: {
    type: Array,
    required: true
  },
  autoStart: {
    type: Boolean,
    default: false
  },
  tutorialId: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['complete', 'skip', 'close'])

// Estado
const isActive = ref(false)
const currentStepIndex = ref(0)
const dontShowAgain = ref(false)
const elementRect = ref({})
const windowSize = ref({ width: 0, height: 0 })

// Computed
const currentStep = computed(() => props.steps[currentStepIndex.value] || {})

const spotlightStyle = computed(() => {
  if (!currentStep.value.element || !elementRect.value.width) return {}
  
  const padding = 8
  return {
    left: `${elementRect.value.left - padding}px`,
    top: `${elementRect.value.top - padding}px`,
    width: `${elementRect.value.width + padding * 2}px`,
    height: `${elementRect.value.height + padding * 2}px`,
  }
})

const cardPosition = computed(() => {
  if (!currentStep.value.element || !elementRect.value.width) {
    // Centralizar se não há elemento específico
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }
  
  // Posicionar próximo ao elemento destacado
  const rect = elementRect.value
  const cardWidth = 400
  const cardHeight = 300
  
  let left = rect.left + rect.width + 20
  let top = rect.top
  
  // Ajustar se sair da tela
  if (left + cardWidth > windowSize.value.width) {
    left = rect.left - cardWidth - 20
  }
  
  if (top + cardHeight > windowSize.value.height) {
    top = windowSize.value.height - cardHeight - 20
  }
  
  if (top < 20) {
    top = 20
  }
  
  return {
    position: 'fixed',
    left: `${Math.max(20, left)}px`,
    top: `${top}px`
  }
})

// Methods
function startTutorial() {
  // Verificar se já foi mostrado
  const shown = localStorage.getItem(`tutorial-${props.tutorialId}`)
  if (shown) return
  
  isActive.value = true
  currentStepIndex.value = 0
  updateElementRect()
}

function nextStep() {
  if (currentStepIndex.value < props.steps.length - 1) {
    currentStepIndex.value++
    updateElementRect()
  }
}

function previousStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
    updateElementRect()
  }
}

function goToStep(index) {
  currentStepIndex.value = index
  updateElementRect()
}

function completeTutorial() {
  if (dontShowAgain.value) {
    localStorage.setItem(`tutorial-${props.tutorialId}`, 'completed')
  }
  
  isActive.value = false
  emit('complete')
}

function skipTutorial() {
  if (dontShowAgain.value) {
    localStorage.setItem(`tutorial-${props.tutorialId}`, 'skipped')
  }
  
  isActive.value = false
  emit('skip')
}

function closeTutorial() {
  isActive.value = false
  emit('close')
}

function executeAction(action) {
  if (action.callback) {
    action.callback()
  } else if (action.click) {
    const element = document.querySelector(action.click)
    if (element) {
      element.click()
    }
  }
}

function updateElementRect() {
  nextTick(() => {
    if (!currentStep.value.element) return
    
    const element = document.querySelector(currentStep.value.element)
    if (element) {
      const rect = element.getBoundingClientRect()
      elementRect.value = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }
      
      // Scroll para o elemento se necessário
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      })
    }
  })
}

function updateWindowSize() {
  windowSize.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

function handleKeydown(event) {
  if (!isActive.value) return
  
  switch (event.key) {
    case 'Escape':
      closeTutorial()
      break
    case 'ArrowRight':
      nextStep()
      break
    case 'ArrowLeft':
      previousStep()
      break
  }
}

// Watchers
watch(currentStepIndex, () => {
  updateElementRect()
})

// Lifecycle
onMounted(() => {
  updateWindowSize()
  window.addEventListener('resize', updateWindowSize)
  window.addEventListener('keydown', handleKeydown)
  
  if (props.autoStart) {
    startTutorial()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize)
  window.removeEventListener('keydown', handleKeydown)
})

// Expose methods
defineExpose({
  start: startTutorial,
  next: nextStep,
  previous: previousStep,
  close: closeTutorial
})
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2000;
  pointer-events: auto;
}

.spotlight {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  z-index: 2001;
  pointer-events: none;
  transition: all 0.3s ease;
}

.tutorial-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  min-width: 320px;
  z-index: 2002;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.step-indicator {
  font-weight: 600;
  font-size: 0.875rem;
}

.step-separator {
  margin: 0 0.25rem;
  opacity: 0.7;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tutorial-content {
  padding: 1.5rem;
}

.tutorial-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.75rem 0;
}

.tutorial-description {
  color: #495057;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.tutorial-media {
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
}

.tutorial-media img,
.tutorial-media video {
  width: 100%;
  height: auto;
  display: block;
}

.tutorial-code {
  background: #2c3e50;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}

.tutorial-code pre {
  margin: 0;
  color: #ecf0f1;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.tutorial-action {
  margin: 1rem 0;
}

.action-btn {
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
  transition: background 0.2s ease;
}

.action-btn:hover {
  background: #2980b9;
}

.tutorial-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.complete-btn {
  background: #27ae60;
  color: white;
  border-color: #27ae60;
}

.complete-btn:hover {
  background: #229954;
  border-color: #229954;
  color: white;
}

.nav-indicators {
  display: flex;
  gap: 0.5rem;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dee2e6;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator.active {
  background: #3498db;
  transform: scale(1.2);
}

.indicator.completed {
  background: #27ae60;
}

.tutorial-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.875rem;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  cursor: pointer;
}

.skip-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  text-decoration: underline;
}

.skip-btn:hover {
  color: #495057;
}

@media (max-width: 768px) {
  .tutorial-card {
    max-width: calc(100vw - 2rem);
    min-width: auto;
    margin: 1rem;
  }
  
  .tutorial-navigation {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-indicators {
    order: -1;
  }
}
</style>