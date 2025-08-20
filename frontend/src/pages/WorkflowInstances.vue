<template>
  <div class="workflow-instances-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>Instâncias de Workflow</h1>
          <p class="subtitle">Acompanhe o progresso dos workflows em execução</p>
        </div>
        <div class="header-actions">
          <button 
            class="btn btn-outline"
            @click="refreshInstances"
            :disabled="loading"
          >
            <i class="lucide-refresh-cw" :class="{ 'spinning': loading }"></i>
            Atualizar
          </button>
        </div>
      </div>
    </header>

    <div class="page-content">
      <!-- Filtros e Busca -->
      <div class="filters-section">
        <div class="search-bar">
          <div class="search-input">
            <i class="lucide-search"></i>
            <input 
              type="text" 
              v-model="searchTerm" 
              placeholder="Buscar por ID, workflow ou solicitação..."
              @input="debouncedSearch"
            />
          </div>
        </div>
        
        <div class="filters">
          <select v-model="filters.status" @change="applyFilters">
            <option value="">Todos os Status</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="aguardando_aprovacao">Aguardando Aprovação</option>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
            <option value="cancelado">Cancelado</option>
            <option value="expirado">Expirado</option>
          </select>
          
          <select v-model="filters.workflow_id" @change="applyFilters">
            <option value="">Todos os Workflows</option>
            <option 
              v-for="workflow in workflows" 
              :key="workflow.id"
              :value="workflow.id"
            >
              {{ workflow.nome }}
            </option>
          </select>
          
          <select v-model="filters.prioridade" @change="applyFilters">
            <option value="">Todas as Prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
          
          <button 
            class="btn btn-outline"
            @click="clearFilters"
            v-if="hasActiveFilters"
          >
            <i class="lucide-x"></i>
            Limpar
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando instâncias...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredInstances.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="lucide-workflow"></i>
        </div>
        <h3>{{ searchTerm || hasActiveFilters ? 'Nenhuma instância encontrada' : 'Nenhuma instância criada' }}</h3>
        <p v-if="!searchTerm && !hasActiveFilters">
          As instâncias de workflow aparecerão aqui quando forem criadas
        </p>
        <p v-else>
          Tente ajustar os filtros ou termos de busca
        </p>
      </div>

      <!-- Instances List -->
      <div v-else class="instances-list">
        <div 
          v-for="instance in paginatedInstances" 
          :key="instance.id"
          class="instance-card"
          :class="getInstanceStatusClass(instance.status_atual)"
          @click="viewInstance(instance)"
        >
          <!-- Card Header -->
          <div class="card-header">
            <div class="instance-info">
              <div class="instance-title">
                <h3>{{ instance.workflow?.nome || 'Workflow não encontrado' }}</h3>
                <span class="instance-id">#{{ instance.id }}</span>
              </div>
              <div class="instance-meta">
                <span class="creator">
                  <i class="lucide-user"></i>
                  {{ instance.criado_por?.nome || 'Usuário não encontrado' }}
                </span>
                <span class="creation-date">
                  <i class="lucide-calendar"></i>
                  {{ formatDate(instance.criado_em) }}
                </span>
              </div>
            </div>
            
            <div class="card-actions">
              <span 
                class="priority-badge"
                :class="`priority-${instance.prioridade}`"
              >
                {{ getPriorityLabel(instance.prioridade) }}
              </span>
              <span 
                class="status-badge"
                :class="`status-${instance.status_atual}`"
              >
                {{ getStatusLabel(instance.status_atual) }}
              </span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-section">
            <div class="progress-info">
              <span class="progress-text">
                Estado: {{ instance.estado_atual || 'Não definido' }}
              </span>
              <span class="progress-percentage">
                {{ calculateProgress(instance) }}%
              </span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: `${calculateProgress(instance)}%` }"
              ></div>
            </div>
          </div>

          <!-- Instance Details -->
          <div class="instance-details">
            <div v-if="instance.solicitacao_id" class="detail-item">
              <i class="lucide-file-text"></i>
              <span>Solicitação: #{{ instance.solicitacao_id }}</span>
            </div>
            
            <div v-if="instance.observacoes" class="detail-item">
              <i class="lucide-message-square"></i>
              <span>{{ instance.observacoes }}</span>
            </div>
            
            <div v-if="instance.prazo_conclusao" class="detail-item">
              <i class="lucide-clock"></i>
              <span class="deadline" :class="{ 'overdue': isOverdue(instance.prazo_conclusao) }">
                Prazo: {{ formatDate(instance.prazo_conclusao) }}
              </span>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button 
              class="btn btn-sm btn-outline"
              @click.stop="viewInstance(instance)"
              title="Ver detalhes"
            >
              <i class="lucide-eye"></i>
            </button>
            
            <button 
              v-if="canApprove(instance)"
              class="btn btn-sm btn-primary"
              @click.stop="approveInstance(instance)"
              title="Aprovar"
            >
              <i class="lucide-check"></i>
            </button>
            
            <button 
              v-if="canReject(instance)"
              class="btn btn-sm btn-danger"
              @click.stop="rejectInstance(instance)"
              title="Rejeitar"
            >
              <i class="lucide-x"></i>
            </button>
            
            <button 
              v-if="canCancel(instance)"
              class="btn btn-sm btn-warning"
              @click.stop="cancelInstance(instance)"
              title="Cancelar"
            >
              <i class="lucide-square"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          class="btn btn-outline"
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
        >
          <i class="lucide-chevron-left"></i>
          Anterior
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="btn btn-outline"
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
        >
          Próxima
          <i class="lucide-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal de Ação Rápida -->
    <div v-if="showActionModal" class="modal-overlay" @click="closeActionModal">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h3>{{ actionModal.title }}</h3>
          <button class="btn-close" @click="closeActionModal">
            <i class="lucide-x"></i>
          </button>
        </header>
        
        <div class="modal-body">
          <p>{{ actionModal.message }}</p>
          
          <div v-if="actionModal.type === 'reject' || actionModal.type === 'cancel'" class="form-group">
            <label>Motivo (opcional):</label>
            <textarea 
              v-model="actionModal.reason" 
              rows="3"
              placeholder="Descreva o motivo da ação..."
            ></textarea>
          </div>
        </div>
        
        <footer class="modal-footer">
          <button class="btn btn-outline" @click="closeActionModal">
            Cancelar
          </button>
          <button 
            class="btn"
            :class="actionModal.confirmClass"
            @click="confirmAction"
            :disabled="performingAction"
          >
            {{ performingAction ? 'Processando...' : actionModal.confirmText }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

// Estado reativo
const instances = ref([])
const workflows = ref([])
const loading = ref(false)
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(12)

// Modal de ação
const showActionModal = ref(false)
const actionModal = ref({})
const performingAction = ref(false)

// Filtros
const filters = ref({
  status: '',
  workflow_id: '',
  prioridade: ''
})

// Computed
const filteredInstances = computed(() => {
  let result = [...instances.value]
  
  // Filtro por busca
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(instance => {
      return (
        instance.id.toString().includes(term) ||
        instance.workflow?.nome?.toLowerCase().includes(term) ||
        instance.solicitacao_id?.toString().includes(term) ||
        instance.observacoes?.toLowerCase().includes(term)
      )
    })
  }
  
  // Filtros por status, workflow e prioridade
  if (filters.value.status) {
    result = result.filter(instance => instance.status_atual === filters.value.status)
  }
  
  if (filters.value.workflow_id) {
    result = result.filter(instance => instance.workflow_id == filters.value.workflow_id)
  }
  
  if (filters.value.prioridade) {
    result = result.filter(instance => instance.prioridade === filters.value.prioridade)
  }
  
  return result
})

const paginatedInstances = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredInstances.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredInstances.value.length / itemsPerPage.value)
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(filter => filter !== '')
})

// Watchers
watch(filteredInstances, () => {
  currentPage.value = 1
})

// Debounce search
const customDebounce = (func, wait) => {
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

const debouncedSearch = customDebounce(() => {
  applyFilters()
}, 300)

// Métodos
const loadInstances = async () => {
  try {
    loading.value = true
    const response = await api.get('/workflows/instances')
    
    if (response.data.success) {
      instances.value = response.data.instances || []
    }
  } catch (error) {
    console.error('Erro ao carregar instâncias:', error)
    instances.value = []
  } finally {
    loading.value = false
  }
}

const loadWorkflows = async () => {
  try {
    const response = await api.get('/workflows')
    
    if (response.data.success) {
      workflows.value = response.data.workflows || []
    }
  } catch (error) {
    console.error('Erro ao carregar workflows:', error)
    workflows.value = []
  }
}

const refreshInstances = () => {
  loadInstances()
}

const applyFilters = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  filters.value = {
    status: '',
    workflow_id: '',
    prioridade: ''
  }
  searchTerm.value = ''
  applyFilters()
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const viewInstance = (instance) => {
  router.push(`/workflows/instances/${instance.id}`)
}

const getInstanceStatusClass = (status) => {
  const statusClasses = {
    'em_andamento': 'status-in-progress',
    'aguardando_aprovacao': 'status-pending',
    'aprovado': 'status-approved',
    'rejeitado': 'status-rejected',
    'cancelado': 'status-cancelled',
    'expirado': 'status-expired'
  }
  return statusClasses[status] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    'em_andamento': 'Em Andamento',
    'aguardando_aprovacao': 'Aguardando Aprovação',
    'aprovado': 'Aprovado',
    'rejeitado': 'Rejeitado',
    'cancelado': 'Cancelado',
    'expirado': 'Expirado'
  }
  return labels[status] || status
}

const getPriorityLabel = (priority) => {
  const labels = {
    'baixa': 'Baixa',
    'normal': 'Normal',
    'alta': 'Alta',
    'critica': 'Crítica'
  }
  return labels[priority] || priority
}

const calculateProgress = (instance) => {
  if (!instance.workflow || !instance.workflow.estados) {
    return 0
  }
  
  const estados = instance.workflow.estados
  const currentStateIndex = estados.findIndex(estado => estado.id === instance.estado_atual)
  
  if (currentStateIndex === -1) {
    return 0
  }
  
  return Math.round(((currentStateIndex + 1) / estados.length) * 100)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOverdue = (deadline) => {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

const canApprove = (instance) => {
  return instance.status_atual === 'aguardando_aprovacao' && 
         authStore.user && 
         (authStore.user.perfil === 'supervisor' || authStore.user.perfil === 'administrador')
}

const canReject = (instance) => {
  return instance.status_atual === 'aguardando_aprovacao' && 
         authStore.user && 
         (authStore.user.perfil === 'supervisor' || authStore.user.perfil === 'administrador')
}

const canCancel = (instance) => {
  return ['em_andamento', 'aguardando_aprovacao'].includes(instance.status_atual) &&
         authStore.user &&
         (instance.criado_por?.id === authStore.user.id || 
          authStore.user.perfil === 'supervisor' || 
          authStore.user.perfil === 'administrador')
}

const approveInstance = (instance) => {
  actionModal.value = {
    type: 'approve',
    instance,
    title: 'Aprovar Instância',
    message: `Deseja aprovar a instância #${instance.id}?`,
    confirmText: 'Aprovar',
    confirmClass: 'btn-primary',
    reason: ''
  }
  showActionModal.value = true
}

const rejectInstance = (instance) => {
  actionModal.value = {
    type: 'reject',
    instance,
    title: 'Rejeitar Instância',
    message: `Deseja rejeitar a instância #${instance.id}?`,
    confirmText: 'Rejeitar',
    confirmClass: 'btn-danger',
    reason: ''
  }
  showActionModal.value = true
}

const cancelInstance = (instance) => {
  actionModal.value = {
    type: 'cancel',
    instance,
    title: 'Cancelar Instância',
    message: `Deseja cancelar a instância #${instance.id}?`,
    confirmText: 'Cancelar',
    confirmClass: 'btn-warning',
    reason: ''
  }
  showActionModal.value = true
}

const confirmAction = async () => {
  try {
    performingAction.value = true
    const { type, instance, reason } = actionModal.value
    
    const endpoint = `/workflows/instances/${instance.id}/${type}`
    const payload = reason ? { motivo: reason } : {}
    
    const response = await api.post(endpoint, payload)
    
    if (response.data.success) {
      // Atualizar a instância na lista
      const index = instances.value.findIndex(i => i.id === instance.id)
      if (index !== -1) {
        const updatedStatus = type === 'approve' ? 'aprovado' : 
                            type === 'reject' ? 'rejeitado' : 'cancelado'
        instances.value[index].status_atual = updatedStatus
      }
      
      closeActionModal()
    }
    
  } catch (error) {
    console.error(`Erro ao ${actionModal.value.type} instância:`, error)
  } finally {
    performingAction.value = false
  }
}

const closeActionModal = () => {
  showActionModal.value = false
  actionModal.value = {}
  performingAction.value = false
}

// Lifecycle
onMounted(() => {
  loadInstances()
  loadWorkflows()
})
</script>

<style scoped>
.workflow-instances-page {
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
  align-items: center;
  gap: 2rem;
}

.header-left h1 {
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
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.search-bar {
  margin-bottom: 1rem;
}

.search-input {
  position: relative;
  max-width: 400px;
}

.search-input i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.search-input input:focus {
  outline: none;
  border-color: #3498db;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.filters select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  min-width: 150px;
}

.filters select:focus {
  outline: none;
  border-color: #3498db;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  opacity: 0.8;
}

.instances-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.instance-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 4px solid #e9ecef;
}

.instance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.instance-card.status-in-progress {
  border-left-color: #3498db;
}

.instance-card.status-pending {
  border-left-color: #f39c12;
}

.instance-card.status-approved {
  border-left-color: #2ecc71;
}

.instance-card.status-rejected {
  border-left-color: #e74c3c;
}

.instance-card.status-cancelled {
  border-left-color: #95a5a6;
}

.instance-card.status-expired {
  border-left-color: #e67e22;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.instance-info {
  flex: 1;
}

.instance-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.instance-title h3 {
  color: var(--primary-color);
  font-size: 1.1rem;
  margin: 0;
}

.instance-id {
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.instance-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.instance-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.priority-badge, .status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.priority-baixa {
  background: rgba(149, 165, 166, 0.2);
  color: #95a5a6;
}

.priority-normal {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.priority-alta {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.priority-critica {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.status-em_andamento {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.status-aguardando_aprovacao {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.status-aprovado {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.status-rejeitado {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.status-cancelado {
  background: rgba(149, 165, 166, 0.2);
  color: #95a5a6;
}

.status-expirado {
  background: rgba(230, 126, 34, 0.2);
  color: #e67e22;
}

.progress-section {
  margin-bottom: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.progress-text {
  color: var(--text-secondary);
}

.progress-percentage {
  color: var(--primary-color);
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.instance-details {
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.detail-item:last-child {
  margin-bottom: 0;
}

.deadline.overdue {
  color: #e74c3c;
  font-weight: 500;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover {
  background: #f8f9fa;
}

.page-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* Modal Styles */
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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

.modal-header h3 {
  color: var(--primary-color);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 0 1.5rem 1.5rem;
}

.form-group {
  margin-top: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .workflow-instances-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters select {
    min-width: auto;
  }
  
  .instances-list {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .card-actions {
    flex-direction: row;
    align-items: center;
  }
  
  .instance-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
  
  .modal-content {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
}
</style>