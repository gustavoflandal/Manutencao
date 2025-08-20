<template>
  <div class="workflows-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>
            <i class="lucide-workflow"></i>
            Workflows
          </h1>
          <p class="subtitle">Gerencie processos automatizados e aprovações</p>
        </div>
        <div class="header-actions">
          <button 
            class="btn btn-outline"
            @click="$router.push('/workflows/instances')"
          >
            <i class="lucide-list"></i>
            Instâncias
          </button>
          <button 
            class="btn btn-primary"
            @click="$router.push('/workflows/create')"
            v-if="canCreateWorkflow"
          >
            <i class="lucide-plus"></i>
            Novo Workflow
          </button>
          <button 
            class="btn btn-secondary"
            @click="$router.push('/workflows/templates')"
          >
            <i class="lucide-layout-template"></i>
            Templates
          </button>
        </div>
      </div>
    </header>

    <div class="page-content">
      <!-- Filtros -->
      <div class="filters-section">
        <div class="filters-row">
          <div class="filter-group">
            <label>Buscar</label>
            <div class="search-input">
              <i class="lucide-search"></i>
              <input 
                type="text" 
                v-model="filters.search" 
                placeholder="Nome ou descrição do workflow..."
                @input="debouncedSearch"
              />
            </div>
          </div>
          
          <div class="filter-group">
            <label>Categoria</label>
            <select v-model="filters.categoria">
              <option value="">Todas</option>
              <option value="operacional">Operacional</option>
              <option value="financeiro">Financeiro</option>
              <option value="emergencial">Emergencial</option>
              <option value="administrativo">Administrativo</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Status</label>
            <select v-model="filters.ativo">
              <option value="">Todos</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          
          <button class="btn btn-outline" @click="clearFilters">
            <i class="lucide-x"></i>
            Limpar
          </button>
        </div>
      </div>

      <!-- Lista de Workflows -->
      <div class="workflows-grid" v-if="!loading && workflows.length > 0">
        <div 
          class="workflow-card" 
          v-for="workflow in workflows" 
          :key="workflow.id"
          @click="viewWorkflow(workflow)"
        >
          <div class="workflow-header">
            <div class="workflow-info">
              <h3>{{ workflow.nome }}</h3>
              <span class="workflow-category" :class="`category-${workflow.categoria}`">
                {{ getCategoryLabel(workflow.categoria) }}
              </span>
            </div>
            <div class="workflow-actions" @click.stop>
              <button 
                class="btn-icon" 
                @click="editWorkflow(workflow)"
                v-if="canEditWorkflow(workflow)"
                title="Editar"
              >
                <i class="lucide-edit"></i>
              </button>
              <button 
                class="btn-icon" 
                @click="duplicateWorkflow(workflow)"
                title="Duplicar"
              >
                <i class="lucide-copy"></i>
              </button>
              <button 
                class="btn-icon danger" 
                @click="deleteWorkflow(workflow)"
                v-if="canDeleteWorkflow(workflow)"
                title="Excluir"
              >
                <i class="lucide-trash-2"></i>
              </button>
            </div>
          </div>
          
          <div class="workflow-content">
            <p class="workflow-description">{{ workflow.descricao }}</p>
            
            <div class="workflow-stats">
              <div class="stat">
                <span class="stat-label">Estados</span>
                <span class="stat-value">{{ workflow.estados?.length || 0 }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Transições</span>
                <span class="stat-value">{{ workflow.transicoes?.length || 0 }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Prazo</span>
                <span class="stat-value">{{ workflow.prazo_maximo }}h</span>
              </div>
            </div>
            
            <div class="workflow-footer">
              <div class="workflow-status">
                <span 
                  class="status-badge" 
                  :class="{ 'active': workflow.ativo, 'inactive': !workflow.ativo }"
                >
                  {{ workflow.ativo ? 'Ativo' : 'Inativo' }}
                </span>
                <span v-if="workflow.template" class="template-badge">Template</span>
              </div>
              
              <div class="workflow-meta">
                <small>Criado em {{ formatDate(workflow.created_at) }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vazio -->
      <div class="empty-state" v-if="!loading && workflows.length === 0">
        <div class="empty-icon">
          <i class="lucide-workflow"></i>
        </div>
        <h3>Nenhum workflow encontrado</h3>
        <p>{{ hasFilters ? 'Tente ajustar os filtros ou' : '' }} Crie seu primeiro workflow automatizado.</p>
        <button 
          class="btn btn-primary"
          @click="$router.push('/workflows/create')"
          v-if="canCreateWorkflow"
        >
          <i class="lucide-plus"></i>
          Criar Workflow
        </button>
      </div>

      <!-- Loading -->
      <div class="loading-state" v-if="loading">
        <div class="spinner"></div>
        <p>Carregando workflows...</p>
      </div>
    </div>

    <!-- Modal de confirmação para exclusão -->
    <div class="modal-overlay" v-if="showDeleteModal" @click="cancelDelete">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Confirmar Exclusão</h3>
          <button class="btn-close" @click="cancelDelete">
            <i class="lucide-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja excluir o workflow <strong>{{ workflowToDelete?.nome }}</strong>?</p>
          <p class="warning">Esta ação não pode ser desfeita.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="cancelDelete">Cancelar</button>
          <button class="btn btn-danger" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Excluindo...' : 'Excluir' }}
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

// Função debounce personalizada
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

const router = useRouter()
const authStore = useAuthStore()

// Estado reativo
const workflows = ref([])
const loading = ref(false)
const showDeleteModal = ref(false)
const workflowToDelete = ref(null)
const deleting = ref(false)

// Filtros
const filters = ref({
  search: '',
  categoria: '',
  ativo: ''
})

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

const hasFilters = computed(() => {
  return filters.value.search || filters.value.categoria || filters.value.ativo
})

// Métodos
const debouncedSearch = debounce(() => {
  loadWorkflows()
}, 500)

const loadWorkflows = async () => {
  try {
    loading.value = true
    
    const params = {}
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.categoria) params.categoria = filters.value.categoria
    if (filters.value.ativo) params.ativo = filters.value.ativo === 'true'
    
    const response = await api.get('/workflows', { params })
    workflows.value = response.data.workflows || []
  } catch (error) {
    console.error('Erro ao carregar workflows:', error)
    workflows.value = []
  } finally {
    loading.value = false
  }
}

const viewWorkflow = (workflow) => {
  router.push(`/workflows/${workflow.id}`)
}

const editWorkflow = (workflow) => {
  router.push(`/workflows/${workflow.id}/edit`)
}

const canEditWorkflow = (workflow) => {
  const roleLevel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  const userLevel = roleLevel[authStore.user?.perfil] || 0
  
  // Admin pode editar qualquer workflow
  if (userLevel >= 4) return true
  
  // Criador pode editar seu workflow
  return workflow.user_id === authStore.user?.id
}

const canDeleteWorkflow = (workflow) => {
  const roleLevel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  const userLevel = roleLevel[authStore.user?.perfil] || 0
  
  // Admin pode excluir qualquer workflow
  if (userLevel >= 4) return true
  
  // Criador pode excluir seu workflow se não for template público
  return workflow.user_id === authStore.user?.id && !workflow.publico
}

const duplicateWorkflow = async (workflow) => {
  try {
    const response = await api.post(`/workflows/${workflow.id}/duplicate`)
    if (response.data.success) {
      await loadWorkflows()
      // Opcional: redirecionar para editar o workflow duplicado
      router.push(`/workflows/${response.data.data.id}/edit`)
    }
  } catch (error) {
    console.error('Erro ao duplicar workflow:', error)
  }
}

const deleteWorkflow = (workflow) => {
  workflowToDelete.value = workflow
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  try {
    deleting.value = true
    await api.delete(`/workflows/${workflowToDelete.value.id}`)
    await loadWorkflows()
    cancelDelete()
  } catch (error) {
    console.error('Erro ao excluir workflow:', error)
  } finally {
    deleting.value = false
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  workflowToDelete.value = null
  deleting.value = false
}

const clearFilters = () => {
  filters.value = {
    search: '',
    categoria: '',
    ativo: ''
  }
  loadWorkflows()
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

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR')
}

// Lifecycle
onMounted(() => {
  loadWorkflows()
})
</script>

<style scoped>
.workflows-page {
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: flex;
  gap: 1.5rem;
  align-items: end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.filter-group label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.search-input {
  position: relative;
}

.search-input i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input input {
  padding-left: 40px;
}

.workflows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.workflow-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.workflow-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.workflow-info h3 {
  color: var(--primary-color);
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.workflow-category {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.workflow-actions {
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

.btn-icon.danger:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.workflow-description {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.workflow-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
}

.workflow-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.workflow-status {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.status-badge.inactive {
  background: rgba(149, 165, 166, 0.1);
  color: #95a5a6;
}

.template-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.workflow-meta small {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

/* Modal styles */
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

.modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
  margin: 0;
  color: var(--primary-color);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.warning {
  color: #e74c3c;
  font-weight: 500;
  margin-top: 1rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .workflows-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters-row {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: auto;
  }
  
  .workflows-grid {
    grid-template-columns: 1fr;
  }
  
  .workflow-stats {
    flex-wrap: wrap;
  }
  
  .workflow-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
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

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
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

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

input, select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
  transition: border-color 0.3s ease;
}

input:focus, select:focus {
  outline: none;
  border-color: #3498db;
}
</style>