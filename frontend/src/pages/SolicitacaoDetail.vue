<template>
  <div class="solicitacao-detail-page">
    <header class="page-header">
      <div class="header-info">
        <h1>{{ solicitacao?.numero }}</h1>
        <span class="status" :class="`status-${solicitacao?.status}`">
          {{ formatStatus(solicitacao?.status) }}
        </span>
      </div>
      <div class="header-actions">
        <button 
          v-if="canEdit" 
          class="btn btn-edit" 
          @click="$router.push(`/solicitacoes/${solicitacao?.id}/edit`)"
        >
          <i class="fas fa-edit"></i>
          Editar
        </button>
        <button class="btn btn-outline" @click="$router.push('/solicitacoes')">
          <i class="fas fa-arrow-left"></i>
          Voltar
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando detalhes...</p>
    </div>

    <!-- Conteúdo da solicitação -->
    <div v-else-if="solicitacao" class="content">
      <!-- Informações principais -->
      <div class="main-card">
        <h2>{{ solicitacao.titulo }}</h2>
        
        <div class="details-grid">
          <div class="detail-item">
            <span class="label">Categoria:</span>
            <span class="value">{{ formatCategoria(solicitacao.categoria) }}</span>
          </div>
          
          <div v-if="solicitacao.subcategoria" class="detail-item">
            <span class="label">Subcategoria:</span>
            <span class="value">{{ solicitacao.subcategoria }}</span>
          </div>
          
          <div class="detail-item">
            <span class="label">Prioridade:</span>
            <span class="value prioridade" :class="`prioridade-${solicitacao.prioridade}`">
              {{ formatPrioridade(solicitacao.prioridade) }}
            </span>
          </div>
          
          <div class="detail-item">
            <span class="label">Localização:</span>
            <span class="value">{{ solicitacao.localizacao }}</span>
          </div>
          
          <div v-if="solicitacao.department" class="detail-item">
            <span class="label">Departamento:</span>
            <span class="value">{{ solicitacao.department.nome }}</span>
          </div>
          
          <div class="detail-item">
            <span class="label">Criada em:</span>
            <span class="value">{{ formatDate(solicitacao.created_at) }}</span>
          </div>
          
          <div v-if="solicitacao.data_prevista" class="detail-item">
            <span class="label">Data Prevista:</span>
            <span class="value">{{ formatDate(solicitacao.data_prevista) }}</span>
          </div>
          
          <div v-if="solicitacao.data_fechamento" class="detail-item">
            <span class="label">Data Fechamento:</span>
            <span class="value">{{ formatDate(solicitacao.data_fechamento) }}</span>
          </div>
        </div>

        <div class="description-section">
          <h3>Descrição</h3>
          <p class="description">{{ solicitacao.descricao }}</p>
        </div>

        <div v-if="solicitacao.observacoes" class="observations-section">
          <h3>Observações</h3>
          <pre class="observations">{{ solicitacao.observacoes }}</pre>
        </div>
      </div>

      <!-- Pessoas envolvidas -->
      <div class="people-card">
        <h3>Pessoas Envolvidas</h3>
        
        <div class="people-grid">
          <div class="person-item">
            <span class="role">Solicitante:</span>
            <div class="person-info">
              <span class="name">{{ solicitacao.solicitante.nome }}</span>
              <span class="email">{{ solicitacao.solicitante.email }}</span>
            </div>
          </div>
          
          <div v-if="solicitacao.responsavel" class="person-item">
            <span class="role">Responsável:</span>
            <div class="person-info">
              <span class="name">{{ solicitacao.responsavel.nome }}</span>
              <span class="email">{{ solicitacao.responsavel.email }}</span>
            </div>
          </div>
          
          <div v-else-if="canAssignResponsible" class="person-item">
            <span class="role">Responsável:</span>
            <div class="assign-section">
              <select v-model="selectedResponsible" class="form-select">
                <option value="">Selecionar responsável</option>
                <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                  {{ tech.nome }}
                </option>
              </select>
              <button 
                class="btn btn-sm btn-primary" 
                @click="assignResponsible"
                :disabled="!selectedResponsible || assigning"
              >
                {{ assigning ? 'Atribuindo...' : 'Atribuir' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ações rápidas para supervisores/admins -->
      <div v-if="canManageStatus" class="actions-card">
        <h3>Ações Rápidas</h3>
        
        <div class="quick-actions">
          <button 
            v-if="solicitacao.status === 'aberta'"
            class="btn btn-primary"
            @click="updateStatus('em_analise')"
          >
            <i class="fas fa-eye"></i>
            Colocar em Análise
          </button>
          
          <button 
            v-if="solicitacao.status === 'em_analise'"
            class="btn btn-success"
            @click="updateStatus('aprovada')"
          >
            <i class="fas fa-check"></i>
            Aprovar
          </button>
          
          <button 
            v-if="solicitacao.status === 'aprovada'"
            class="btn btn-info"
            @click="updateStatus('em_execucao')"
          >
            <i class="fas fa-play"></i>
            Iniciar Execução
          </button>
          
          <button 
            v-if="solicitacao.status === 'em_execucao'"
            class="btn btn-success"
            @click="updateStatus('fechada')"
          >
            <i class="fas fa-check-circle"></i>
            Finalizar
          </button>
          
          <button 
            v-if="['aberta', 'em_analise'].includes(solicitacao.status)"
            class="btn btn-danger"
            @click="showCancelModal = true"
          >
            <i class="fas fa-ban"></i>
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Estado de erro -->
    <div v-else class="error-state">
      <h3>Solicitação não encontrada</h3>
      <p>A solicitação que você está procurando não existe ou foi removida.</p>
      <button class="btn btn-primary" @click="$router.push('/solicitacoes')">
        Voltar para Lista
      </button>
    </div>

    <!-- Modal de cancelamento -->
    <div v-if="showCancelModal" class="modal-overlay" @click="showCancelModal = false">
      <div class="modal" @click.stop>
        <h3>Cancelar Solicitação</h3>
        <p>Tem certeza que deseja cancelar esta solicitação?</p>
        
        <div class="form-group">
          <label for="cancelReason">Motivo do cancelamento:</label>
          <textarea
            id="cancelReason"
            v-model="cancelReason"
            class="form-textarea"
            placeholder="Descreva o motivo do cancelamento..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showCancelModal = false">
            Voltar
          </button>
          <button 
            class="btn btn-danger" 
            @click="cancelSolicitacao"
            :disabled="canceling"
          >
            {{ canceling ? 'Cancelando...' : 'Confirmar Cancelamento' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { success, error } = useToast()

const solicitacao = ref(null)
const loading = ref(false)
const technicians = ref([])
const selectedResponsible = ref('')
const assigning = ref(false)
const showCancelModal = ref(false)
const cancelReason = ref('')
const canceling = ref(false)

const canEdit = computed(() => {
  if (!solicitacao.value) return false
  
  const isOwner = solicitacao.value.solicitante_id === authStore.user?.id
  const isAdmin = ['supervisor', 'administrador'].includes(authStore.user?.perfil)
  const canOwnerEdit = isOwner && solicitacao.value.status === 'aberta'
  
  return isAdmin || canOwnerEdit
})

const canManageStatus = computed(() => {
  return ['supervisor', 'administrador'].includes(authStore.user?.perfil)
})

const canAssignResponsible = computed(() => {
  return canManageStatus.value && !solicitacao.value?.responsavel
})

const loadSolicitacao = async () => {
  try {
    loading.value = true
    const response = await api.get(`/solicitacoes/${route.params.id}`)
    
    if (response.data.success) {
      solicitacao.value = response.data.data.solicitacao
    }
  } catch (err) {
    console.error('Erro ao carregar solicitação:', err)
    error('Erro ao carregar solicitação', 'Não foi possível carregar os dados da solicitação')
  } finally {
    loading.value = false
  }
}

const loadTechnicians = async () => {
  if (!canAssignResponsible.value) return
  
  try {
    const response = await api.get('/users?perfil=tecnico&ativo=true')
    technicians.value = response.data.data.users
  } catch (err) {
    console.error('Erro ao carregar técnicos:', err)
  }
}

const assignResponsible = async () => {
  try {
    assigning.value = true
    
    const response = await api.patch(`/solicitacoes/${solicitacao.value.id}/assign`, {
      responsavel_id: selectedResponsible.value
    })
    
    if (response.data.success) {
      success('Responsável atribuído', 'Responsável atribuído com sucesso')
      await loadSolicitacao() // Recarregar dados
      selectedResponsible.value = ''
    }
  } catch (err) {
    console.error('Erro ao atribuir responsável:', err)
    error('Erro ao atribuir responsável', err.response?.data?.message || 'Erro interno')
  } finally {
    assigning.value = false
  }
}

const updateStatus = async (newStatus) => {
  try {
    const response = await api.put(`/solicitacoes/${solicitacao.value.id}`, {
      status: newStatus
    })
    
    if (response.data.success) {
      success('Status atualizado', `Solicitação colocada como ${formatStatus(newStatus)}`)
      await loadSolicitacao() // Recarregar dados
    }
  } catch (err) {
    console.error('Erro ao atualizar status:', err)
    error('Erro ao atualizar status', err.response?.data?.message || 'Erro interno')
  }
}

const cancelSolicitacao = async () => {
  try {
    canceling.value = true
    
    const response = await api.patch(`/solicitacoes/${solicitacao.value.id}/cancel`, {
      motivo: cancelReason.value
    })
    
    if (response.data.success) {
      success('Solicitação cancelada', 'Solicitação cancelada com sucesso')
      showCancelModal.value = false
      cancelReason.value = ''
      await loadSolicitacao() // Recarregar dados
    }
  } catch (err) {
    console.error('Erro ao cancelar solicitação:', err)
    error('Erro ao cancelar', err.response?.data?.message || 'Erro interno')
  } finally {
    canceling.value = false
  }
}

const formatStatus = (status) => {
  const statusMap = {
    'aberta': 'Aberta',
    'em_analise': 'Em Análise',
    'aprovada': 'Aprovada',
    'em_execucao': 'Em Execução',
    'fechada': 'Fechada',
    'cancelada': 'Cancelada'
  }
  return statusMap[status] || status
}

const formatCategoria = (categoria) => {
  const categoriaMap = {
    'predial': 'Predial',
    'industrial': 'Industrial',
    'ti': 'TI',
    'infraestrutura': 'Infraestrutura'
  }
  return categoriaMap[categoria] || categoria
}

const formatPrioridade = (prioridade) => {
  const prioridadeMap = {
    'baixa': 'Baixa',
    'normal': 'Normal',
    'alta': 'Alta',
    'critica': 'Crítica'
  }
  return prioridadeMap[prioridade] || prioridade
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('pt-BR')
}

onMounted(async () => {
  await loadSolicitacao()
  await loadTechnicians()
})
</script>

<style scoped>
.solicitacao-detail-page {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-info h1 {
  color: var(--primary-color);
  font-size: 2rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.status {
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-aberta { background: #e3f2fd; color: #1976d2; }
.status-em_analise { background: #fff3e0; color: #f57c00; }
.status-aprovada { background: #e8f5e8; color: #388e3c; }
.status-em_execucao { background: #f3e5f5; color: #7b1fa2; }
.status-fechada { background: #f5f5f5; color: #616161; }
.status-cancelada { background: #ffebee; color: #d32f2f; }

.loading-container,
.error-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-left: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.main-card,
.people-card,
.actions-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.main-card h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.value {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 500;
}

.prioridade {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}

.prioridade-baixa { background: #e8f5e8; color: #388e3c; }
.prioridade-normal { background: #e3f2fd; color: #1976d2; }
.prioridade-alta { background: #fff3e0; color: #f57c00; }
.prioridade-critica { background: #ffebee; color: #d32f2f; }

.description-section,
.observations-section {
  border-top: 2px solid var(--border-color);
  padding-top: 1.5rem;
}

.description-section h3,
.observations-section h3 {
  color: var(--primary-color);
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.description {
  line-height: 1.6;
  color: var(--text-primary);
  margin: 0;
}

.observations {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.6;
  margin: 0;
}

.people-card h3,
.actions-card h3 {
  color: var(--primary-color);
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.people-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.person-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.role {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.person-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.name {
  font-weight: 600;
  color: var(--text-primary);
}

.email {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.assign-section {
  display: flex;
  gap: 0.5rem;
  align-items: end;
}

.form-select {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-primary { background: var(--secondary-color); color: white; }
.btn-secondary { background: var(--primary-color); color: white; }
.btn-outline { background: transparent; color: var(--primary-color); border: 2px solid var(--primary-color); }
.btn-info { background: #17a2b8; color: white; }
.btn-success { background: #28a745; color: white; }
.btn-warning { background: #ffc107; color: #212529; }
.btn-danger { background: #dc3545; color: white; }

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(110%);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

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
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.form-group {
  margin: 1.5rem 0;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .solicitacao-detail-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-info {
    justify-content: center;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .people-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .assign-section {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>