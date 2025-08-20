<template>
  <div class="help-modal-overlay" @click="closeModal">
    <div class="help-modal" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-info">
          <h2 class="modal-title">
            <Icon name="help-circle" class="title-icon" />
            {{ content.title }}
          </h2>
          <p v-if="content.description" class="modal-description">
            {{ content.description }}
          </p>
        </div>
        
        <button @click="closeModal" class="close-button">
          <Icon name="x" />
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- Quick Tips -->
        <div v-if="content.quickTips?.length" class="tips-section">
          <h3 class="section-title">
            <Icon name="lightbulb" />
            Dicas Rápidas
          </h3>
          
          <div class="tips-list">
            <div 
              v-for="(tip, index) in content.quickTips" 
              :key="index"
              class="tip-item"
            >
              <Icon name="check-circle" class="tip-icon" />
              <span class="tip-text">{{ tip }}</span>
            </div>
          </div>
        </div>

        <!-- Common Actions -->
        <div v-if="content.commonActions?.length" class="actions-section">
          <h3 class="section-title">
            <Icon name="zap" />
            Ações Comuns
          </h3>
          
          <div class="actions-grid">
            <button
              v-for="(action, index) in content.commonActions"
              :key="index"
              class="action-button"
              @click="executeAction(action)"
            >
              <Icon :name="action.icon" class="action-icon" />
              <div class="action-info">
                <span class="action-title">{{ action.title }}</span>
                <span class="action-description">{{ action.description }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Step by Step Guide -->
        <div v-if="content.stepByStep?.length" class="guide-section">
          <h3 class="section-title">
            <Icon name="list" />
            Passo a Passo
          </h3>
          
          <div class="steps-list">
            <div 
              v-for="(step, index) in content.stepByStep" 
              :key="index"
              class="step-item"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <h4 class="step-title">{{ step.title }}</h4>
                <p class="step-description">{{ step.description }}</p>
                
                <!-- Step Screenshot -->
                <div v-if="step.screenshot" class="step-screenshot">
                  <img :src="step.screenshot" :alt="step.title" />
                </div>
                
                <!-- Step Video -->
                <div v-if="step.video" class="step-video">
                  <button @click="playVideo(step.video)" class="video-button">
                    <Icon name="play" />
                    Assistir demonstração
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Keyboard Shortcuts -->
        <div v-if="content.shortcuts?.length" class="shortcuts-section">
          <h3 class="section-title">
            <Icon name="keyboard" />
            Atalhos do Teclado
          </h3>
          
          <div class="shortcuts-grid">
            <div 
              v-for="(shortcut, index) in content.shortcuts" 
              :key="index"
              class="shortcut-item"
            >
              <div class="shortcut-keys">
                <kbd 
                  v-for="(key, keyIndex) in shortcut.keys" 
                  :key="keyIndex"
                  class="key"
                >
                  {{ key }}
                </kbd>
              </div>
              <span class="shortcut-description">{{ shortcut.description }}</span>
            </div>
          </div>
        </div>

        <!-- Related Sections -->
        <div v-if="content.relatedSections?.length" class="related-section">
          <h3 class="section-title">
            <Icon name="link" />
            Documentação Relacionada
          </h3>
          
          <div class="related-links">
            <button
              v-for="section in content.relatedSections"
              :key="section.id"
              class="related-link"
              @click="openDocumentation(section.id)"
            >
              <Icon name="book-open" class="link-icon" />
              {{ section.title }}
              <Icon name="external-link" class="external-icon" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-actions">
          <button @click="openFullDocumentation" class="doc-button">
            <Icon name="book-open" />
            Ver Documentação Completa
          </button>
          
          <button @click="reportIssue" class="report-button">
            <Icon name="flag" />
            Reportar Problema
          </button>
        </div>
        
        <div class="footer-info">
          <span class="help-text">
            Precisa de mais ajuda? 
            <button @click="contactSupport" class="support-link">
              Entre em contato
            </button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'

// Props
const props = defineProps({
  content: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close'])

// Router
const router = useRouter()

// Methods
function closeModal() {
  emit('close')
}

function executeAction(action) {
  if (action.route) {
    router.push(action.route)
    closeModal()
  } else if (action.callback) {
    action.callback()
  }
}

function playVideo(videoUrl) {
  // TODO: Implementar player de vídeo
  window.open(videoUrl, '_blank')
}

function openDocumentation(sectionId) {
  router.push(`/help?section=${sectionId}`)
  closeModal()
}

function openFullDocumentation() {
  router.push('/help')
  closeModal()
}

function reportIssue() {
  // TODO: Implementar sistema de report
  const issue = {
    page: router.currentRoute.value.path,
    timestamp: new Date().toISOString(),
    content: props.content.title
  }
  console.log('Report issue:', issue)
}

function contactSupport() {
  // TODO: Implementar contato com suporte
  window.open('mailto:suporte@upkeep.com?subject=Ajuda com ' + props.content.title)
}
</script>

<style scoped>
.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.help-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.header-info {
  flex: 1;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.title-icon {
  color: #3498db;
  font-size: 1.75rem;
}

.modal-description {
  color: #6c757d;
  margin: 0;
  line-height: 1.6;
}

.close-button {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-button:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.tips-section {
  margin-bottom: 2rem;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #e8f5e8;
  border-radius: 8px;
  border-left: 4px solid #28a745;
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

.actions-section {
  margin-bottom: 2rem;
}

.actions-grid {
  display: grid;
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.action-button:hover {
  border-color: #3498db;
  background: #e3f2fd;
}

.action-icon {
  color: #3498db;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.action-info {
  flex: 1;
}

.action-title {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.action-description {
  display: block;
  font-size: 0.875rem;
  color: #6c757d;
}

.guide-section {
  margin-bottom: 2rem;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.step-item {
  display: flex;
  gap: 1rem;
}

.step-number {
  width: 2rem;
  height: 2rem;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.step-description {
  color: #495057;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.step-screenshot {
  margin: 1rem 0;
}

.step-screenshot img {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.video-button {
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

.video-button:hover {
  background: #2980b9;
}

.shortcuts-section {
  margin-bottom: 2rem;
}

.shortcuts-grid {
  display: grid;
  gap: 0.75rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.shortcut-keys {
  display: flex;
  gap: 0.25rem;
}

.key {
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.shortcut-description {
  color: #495057;
  font-size: 0.875rem;
}

.related-section {
  margin-bottom: 2rem;
}

.related-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.related-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: none;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.related-link:hover {
  border-color: #3498db;
  background: #f8f9fa;
  color: #3498db;
}

.link-icon {
  color: #6c757d;
  flex-shrink: 0;
}

.external-icon {
  color: #6c757d;
  font-size: 0.875rem;
  margin-left: auto;
}

.modal-footer {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 1.5rem 2rem;
}

.footer-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.doc-button,
.report-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.doc-button {
  color: #3498db;
  border-color: #3498db;
}

.doc-button:hover {
  background: #3498db;
  color: white;
}

.report-button {
  color: #6c757d;
}

.report-button:hover {
  border-color: #dc3545;
  color: #dc3545;
}

.footer-info {
  text-align: center;
}

.help-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.support-link {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
}

.support-link:hover {
  color: #2980b9;
}

@media (max-width: 768px) {
  .help-modal-overlay {
    padding: 1rem;
    align-items: flex-start;
  }
  
  .help-modal {
    margin-top: 2rem;
  }
  
  .modal-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }
  
  .modal-content {
    padding: 1.5rem;
  }
  
  .modal-footer {
    padding: 1rem 1.5rem;
  }
  
  .footer-actions {
    flex-direction: column;
  }
  
  .step-item {
    flex-direction: column;
  }
  
  .step-number {
    align-self: flex-start;
  }
}
</style>