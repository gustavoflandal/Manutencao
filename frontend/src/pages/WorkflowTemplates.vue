<template>
  <div class="workflow-templates-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button class="btn-back" @click="$router.go(-1)">
            <i class="lucide-arrow-left"></i>
          </button>
          <div>
            <h1>
              <i class="lucide-layout-template"></i>
              Templates de Workflow
            </h1>
            <p class="subtitle">Modelos pré-configurados para processos comuns</p>
          </div>
        </div>
        <div class="header-actions">
          <button 
            class="btn btn-primary"
            @click="$router.push('/workflows/create')"
            v-if="canCreateWorkflow"
          >
            <i class="lucide-plus"></i>
            Criar do Zero
          </button>
        </div>
      </div>
    </header>

    <div class="page-content">
      <!-- Filtros por categoria -->
      <div class="category-filters">
        <button 
          class="category-btn"
          :class="{ active: selectedCategory === '' }"
          @click="selectedCategory = ''"
        >
          Todos
        </button>
        <button 
          v-for="category in categories" 
          :key="category.value"
          class="category-btn"
          :class="[
            { active: selectedCategory === category.value },
            `category-${category.value}`
          ]"
          @click="selectedCategory = category.value"
        >
          <i :class="category.icon"></i>
          {{ category.label }}
        </button>
      </div>

      <!-- Grid de Templates -->
      <div class="templates-grid" v-if="!loading && filteredTemplates.length > 0">
        <div 
          class="template-card" 
          v-for="template in filteredTemplates" 
          :key="template.id"
        >
          <div class="template-header">
            <div class="template-category" :class="`category-${template.categoria}`">
              <i :class="getCategoryIcon(template.categoria)"></i>
              {{ getCategoryLabel(template.categoria) }}
            </div>
            <div class="template-actions">
              <button 
                class="btn-icon" 
                @click="previewTemplate(template)"
                title="Visualizar"
              >
                <i class="lucide-eye"></i>
              </button>
              <button 
                class="btn-icon primary" 
                @click="useTemplate(template)"
                title="Usar Template"
              >
                <i class="lucide-plus-circle"></i>
              </button>
            </div>
          </div>
          
          <div class="template-content">
            <h3>{{ template.nome }}</h3>
            <p class="template-description">{{ template.descricao }}</p>
            
            <div class="template-features">
              <div class="feature" v-if="template.estados?.length">
                <i class="lucide-circles"></i>
                <span>{{ template.estados.length }} Estados</span>
              </div>
              <div class="feature" v-if="template.transicoes?.length">
                <i class="lucide-git-branch"></i>
                <span>{{ template.transicoes.length }} Transições</span>
              </div>
              <div class="feature" v-if="template.niveis_aprovacao?.length">
                <i class="lucide-user-check"></i>
                <span>{{ template.niveis_aprovacao.length }} Níveis</span>
              </div>
              <div class="feature" v-if="template.prazo_maximo">
                <i class="lucide-clock"></i>
                <span>{{ template.prazo_maximo }}h prazo</span>
              </div>
            </div>
            
            <div class="template-footer">
              <div class="template-meta">
                <span class="template-version">v{{ template.versao }}</span>
                <span class="template-type">{{ template.publico ? 'Público' : 'Privado' }}</span>
              </div>
              <button 
                class="btn btn-primary btn-use"
                @click="useTemplate(template)"
              >
                Usar Template
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vazio -->
      <div class="empty-state" v-if="!loading && filteredTemplates.length === 0">
        <div class="empty-icon">
          <i class="lucide-layout-template"></i>
        </div>
        <h3>Nenhum template encontrado</h3>
        <p>
          {{ selectedCategory ? 'Nenhum template disponível nesta categoria.' : 'Nenhum template disponível no momento.' }}
        </p>
        <button 
          class="btn btn-primary"
          @click="$router.push('/workflows/create')"
          v-if="canCreateWorkflow"
        >
          <i class="lucide-plus"></i>
          Criar Workflow Personalizado
        </button>
      </div>

      <!-- Loading -->
      <div class="loading-state" v-if="loading">
        <div class="spinner"></div>
        <p>Carregando templates...</p>
      </div>
    </div>

    <!-- Modal de Preview do Template -->
    <div class="modal-overlay" v-if="showPreviewModal" @click="closePreview">
      <div class="modal preview-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ previewingTemplate?.nome }}</h3>
          <button class="btn-close" @click="closePreview">
            <i class="lucide-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="preview-content" v-if="previewingTemplate">
            <!-- Informações básicas -->
            <div class="preview-section">
              <h4>Informações Gerais</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>Categoria:</label>
                  <span class="category-badge" :class="`category-${previewingTemplate.categoria}`">
                    {{ getCategoryLabel(previewingTemplate.categoria) }}
                  </span>
                </div>
                <div class="info-item">
                  <label>Tipo:</label>
                  <span>{{ previewingTemplate.tipo }}</span>
                </div>
                <div class="info-item">
                  <label>Prazo Máximo:</label>
                  <span>{{ previewingTemplate.prazo_maximo }} horas</span>
                </div>
                <div class="info-item">
                  <label>Prioridade Padrão:</label>
                  <span>{{ previewingTemplate.prioridade_padrao }}</span>
                </div>
              </div>
            </div>
            
            <!-- Estados -->
            <div class="preview-section" v-if="previewingTemplate.estados?.length">
              <h4>Estados do Workflow</h4>
              <div class="states-flow">
                <div 
                  v-for="(estado, index) in previewingTemplate.estados" 
                  :key="estado.id"
                  class="state-item"
                  :class="{ 
                    'initial': estado.id === previewingTemplate.estado_inicial,
                    'final': previewingTemplate.estados_finais?.includes(estado.id)
                  }"
                >
                  <div class="state-badge">
                    <i class="lucide-circle" v-if="estado.id === previewingTemplate.estado_inicial"></i>
                    <i class="lucide-check-circle" v-else-if="previewingTemplate.estados_finais?.includes(estado.id)"></i>
                    <i class="lucide-circle-dot" v-else></i>
                    {{ estado.nome }}
                  </div>
                  <div class="state-description" v-if="estado.descricao">
                    {{ estado.descricao }}
                  </div>
                  <div class="state-arrow" v-if="index < previewingTemplate.estados.length - 1">
                    <i class="lucide-arrow-right"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Níveis de Aprovação -->
            <div class="preview-section" v-if="previewingTemplate.niveis_aprovacao?.length">
              <h4>Níveis de Aprovação</h4>
              <div class="approval-levels">
                <div 
                  v-for="(nivel, index) in previewingTemplate.niveis_aprovacao" 
                  :key="index"
                  class="approval-level"
                >
                  <div class="level-number">{{ index + 1 }}</div>
                  <div class="level-content">
                    <div class="level-title">{{ nivel.nome || `Nível ${index + 1}` }}</div>
                    <div class="level-details">
                      <span v-if="nivel.perfil_requerido">Perfil: {{ nivel.perfil_requerido }}</span>
                      <span v-if="nivel.valor_limite">Limite: R$ {{ nivel.valor_limite }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closePreview">Fechar</button>
          <button class="btn btn-primary" @click="useTemplate(previewingTemplate)">
            <i class="lucide-plus-circle"></i>
            Usar Template
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

// Estado reativo
const templates = ref([])
const loading = ref(false)
const selectedCategory = ref('')
const showPreviewModal = ref(false)
const previewingTemplate = ref(null)

// Categorias disponíveis
const categories = ref([
  { value: 'operacional', label: 'Operacional', icon: 'lucide-settings' },
  { value: 'financeiro', label: 'Financeiro', icon: 'lucide-dollar-sign' },
  { value: 'emergencial', label: 'Emergencial', icon: 'lucide-alert-triangle' },
  { value: 'administrativo', label: 'Administrativo', icon: 'lucide-file-text' }
])

// Computed
const canCreateWorkflow = computed(() => {
  const roleLevel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return roleLevel[authStore.user?.perfil] >= 3
})

const filteredTemplates = computed(() => {
  if (!selectedCategory.value) return templates.value
  return templates.value.filter(template => template.categoria === selectedCategory.value)
})

// Métodos
const loadTemplates = async () => {
  try {
    loading.value = true
    const response = await api.get('/workflows/templates')
    templates.value = response.data.templates || []
  } catch (error) {
    console.error('Erro ao carregar templates:', error)
    templates.value = []
  } finally {
    loading.value = false
  }
}

const useTemplate = async (template) => {
  try {
    // Redirecionar para criar workflow baseado no template
    router.push({
      path: '/workflows/create',
      query: { template: template.id }
    })
  } catch (error) {
    console.error('Erro ao usar template:', error)
  }
}

const previewTemplate = (template) => {
  previewingTemplate.value = template
  showPreviewModal.value = true
}

const closePreview = () => {
  showPreviewModal.value = false
  previewingTemplate.value = null
}

const getCategoryLabel = (categoria) => {
  const labels = {
    'operacional': 'Operacional',
    'financeiro': 'Financeiro',
    'emergencial': 'Emergencial',
    'administrativo': 'Administrativo'
  }
  return labels[categoria] || categoria
}

const getCategoryIcon = (categoria) => {
  const icons = {
    'operacional': 'lucide-settings',
    'financeiro': 'lucide-dollar-sign',
    'emergencial': 'lucide-alert-triangle',
    'administrativo': 'lucide-file-text'
  }
  return icons[categoria] || 'lucide-circle'
}

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.workflow-templates-page {
  padding: 2rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.btn-back {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.header-left h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.category-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid transparent;
  border-radius: 25px;
  background: white;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-btn:hover,
.category-btn.active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.category-btn.category-operacional.active {
  background: #3498db;
  border-color: #3498db;
}

.category-btn.category-financeiro.active {
  background: #e74c3c;
  border-color: #e74c3c;
}

.category-btn.category-emergencial.active {
  background: #e67e22;
  border-color: #e67e22;
}

.category-btn.category-administrativo.active {
  background: #9b59b6;
  border-color: #9b59b6;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
}

.template-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.template-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.template-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.category-operacional {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.category-financeiro {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.category-emergencial {
  background: rgba(230, 126, 34, 0.1);
  color: #e67e22;
}

.category-administrativo {
  background: rgba(155, 89, 182, 0.1);
  color: #9b59b6;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--primary-color);
}

.btn-icon.primary {
  background: var(--primary-color);
  color: white;
}

.btn-icon.primary:hover {
  background: var(--secondary-color);
}

.template-content h3 {
  color: var(--primary-color);
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

.template-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.template-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.feature i {
  color: var(--primary-color);
}

.template-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.template-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.template-version {
  font-weight: 500;
}

.btn-use {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(52, 152, 219, 0.2);
  border-left: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal Preview */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-modal {
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
}

.modal {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: var(--primary-color);
  color: white;
}

.modal-header h3 {
  margin: 0;
  color: white;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.preview-section {
  margin-bottom: 2rem;
}

.preview-section h4 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  width: fit-content;
}

.states-flow {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.state-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  position: relative;
}

.state-item.initial {
  background: rgba(52, 152, 219, 0.1);
  border-left: 4px solid #3498db;
}

.state-item.final {
  background: rgba(46, 204, 113, 0.1);
  border-left: 4px solid #2ecc71;
}

.state-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--primary-color);
}

.state-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.state-arrow {
  margin-left: auto;
  color: var(--text-secondary);
}

.approval-levels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.approval-level {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.level-number {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.level-content {
  flex: 1;
}

.level-title {
  font-weight: 500;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.level-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.02);
}

/* Responsive */
@media (max-width: 768px) {
  .workflow-templates-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .category-filters {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  
  .templates-grid {
    grid-template-columns: 1fr;
  }
  
  .template-features {
    grid-template-columns: 1fr;
  }
  
  .template-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .state-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .state-arrow {
    margin-left: 0;
    align-self: center;
    transform: rotate(90deg);
  }
}

/* Utility classes */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}
</style>