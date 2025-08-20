<template>
  <div class="workflow-detail-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button class="btn-back" @click="$router.go(-1)">
            <i class="lucide-arrow-left"></i>
          </button>
          <div v-if="workflow">
            <h1>{{ workflow.nome }}</h1>
            <div class="workflow-meta">
              <span class="category-badge" :class="`category-${workflow.categoria}`">
                {{ getCategoryLabel(workflow.categoria) }}
              </span>
              <span 
                class="status-badge" 
                :class="{ 'active': workflow.ativo, 'inactive': !workflow.ativo }"
              >
                {{ workflow.ativo ? 'Ativo' : 'Inativo' }}
              </span>
              <span v-if="workflow.template" class="template-badge">Template</span>
            </div>
          </div>
        </div>
        <div class="header-actions" v-if="workflow">
          <button 
            class="btn btn-outline"
            @click="duplicateWorkflow"
          >
            <i class="lucide-copy"></i>
            Duplicar
          </button>
          <button 
            class="btn btn-secondary"
            @click="editWorkflow"
            v-if="canEditWorkflow"
          >
            <i class="lucide-edit"></i>
            Editar
          </button>
          <button 
            class="btn btn-primary"
            @click="createInstance"
            v-if="canCreateInstance"
          >
            <i class="lucide-play"></i>
            Executar
          </button>
        </div>
      </div>
    </header>

    <div class="page-content" v-if="!loading && workflow">
      <!-- Informações Gerais -->
      <div class="info-section">
        <div class="section-header">
          <h2>
            <i class="lucide-info"></i>
            Informações Gerais
          </h2>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>Descrição</h3>
            <p>{{ workflow.descricao || 'Sem descrição' }}</p>
          </div>
          <div class="info-card">
            <h3>Tipo</h3>
            <p>{{ workflow.tipo || 'Não especificado' }}</p>
          </div>
          <div class="info-card">
            <h3>Prazo Máximo</h3>
            <p>{{ workflow.prazo_maximo }} horas</p>
          </div>
          <div class="info-card">
            <h3>Prioridade Padrão</h3>
            <p>{{ workflow.prioridade_padrao || 'Normal' }}</p>
          </div>
          <div class="info-card">
            <h3>Trigger</h3>
            <p>{{ workflow.trigger_evento || 'Manual' }}</p>
          </div>
          <div class="info-card">
            <h3>Versão</h3>
            <p>v{{ workflow.versao }}</p>
          </div>
        </div>
      </div>

      <!-- Fluxo do Workflow -->
      <div class="flow-section">
        <div class="section-header">
          <h2>
            <i class="lucide-git-branch"></i>
            Fluxo do Workflow
          </h2>
        </div>
        <div class="workflow-flow">
          <div 
            v-for="(estado, index) in workflow.estados" 
            :key="estado.id"
            class="flow-step"
            :class="{ 
              'initial': estado.id === workflow.estado_inicial,
              'final': workflow.estados_finais?.includes(estado.id)
            }"
          >
            <div class="step-icon">
              <i class="lucide-circle" v-if="estado.id === workflow.estado_inicial"></i>
              <i class="lucide-check-circle" v-else-if="workflow.estados_finais?.includes(estado.id)"></i>
              <i class="lucide-circle-dot" v-else></i>
            </div>
            <div class="step-content">
              <h4>{{ estado.nome }}</h4>
              <p v-if="estado.descricao">{{ estado.descricao }}</p>
              <div class="step-meta">
                <span v-if="estado.id === workflow.estado_inicial" class="step-type initial">
                  Estado Inicial
                </span>
                <span v-else-if="workflow.estados_finais?.includes(estado.id)" class="step-type final">
                  Estado Final
                </span>
                <span v-else class="step-type">Estado Intermediário</span>
              </div>
            </div>
            <div class="step-arrow" v-if="index < workflow.estados.length - 1">
              <i class="lucide-arrow-down"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Transições -->
      <div class="transitions-section" v-if="workflow.transicoes?.length">
        <div class="section-header">
          <h2>
            <i class="lucide-shuffle"></i>
            Transições Disponíveis
          </h2>
        </div>
        <div class="transitions-grid">
          <div 
            v-for="transicao in workflow.transicoes" 
            :key="`${transicao.de}-${transicao.para}`"
            class="transition-card"
          >
            <div class="transition-flow">
              <div class="state-from">{{ getEstadoNome(transicao.de) }}</div>
              <div class="arrow">
                <i class="lucide-arrow-right"></i>
              </div>
              <div class="state-to">{{ getEstadoNome(transicao.para) }}</div>
            </div>
            <div class="transition-details">
              <h4>{{ transicao.nome || 'Transição' }}</h4>
              <p v-if="transicao.condicao">
                <strong>Condição:</strong> {{ transicao.condicao }}
              </p>
              <div class="transition-meta">
                <span v-if="transicao.requer_aprovacao" class="meta-tag approval">
                  <i class="lucide-user-check"></i>
                  Requer Aprovação
                </span>
                <span v-if="transicao.automatica" class="meta-tag automatic">
                  <i class="lucide-zap"></i>
                  Automática
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Níveis de Aprovação -->
      <div class="approval-section" v-if="workflow.niveis_aprovacao?.length">
        <div class="section-header">
          <h2>
            <i class="lucide-user-check"></i>
            Níveis de Aprovação
          </h2>
        </div>
        <div class="approval-levels">
          <div 
            v-for="(nivel, index) in workflow.niveis_aprovacao" 
            :key="index"
            class="approval-level"
          >
            <div class="level-number">{{ index + 1 }}</div>
            <div class="level-content">
              <h4>{{ nivel.nome || `Nível ${index + 1}` }}</h4>
              <div class="level-details">
                <div class="detail-item" v-if="nivel.perfil_requerido">
                  <label>Perfil Requerido:</label>
                  <span>{{ nivel.perfil_requerido }}</span>
                </div>
                <div class="detail-item" v-if="nivel.valor_limite">
                  <label>Valor Limite:</label>
                  <span>R$ {{ formatCurrency(nivel.valor_limite) }}</span>
                </div>
                <div class="detail-item" v-if="nivel.departamento_id">
                  <label>Departamento:</label>
                  <span>{{ getDepartmentName(nivel.departamento_id) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Configurações Avançadas -->
      <div class="config-section">
        <div class="section-header">
          <h2>
            <i class="lucide-settings"></i>
            Configurações Avançadas
          </h2>
        </div>
        <div class="config-grid">
          <div class="config-card" v-if="workflow.escalacao_config">
            <h3>
              <i class="lucide-trending-up"></i>
              Escalação
            </h3>
            <div class="config-details">
              <p><strong>Tempo:</strong> {{ workflow.escalacao_config.tempo_escalacao }}h</p>
              <p><strong>Para:</strong> {{ workflow.escalacao_config.escalar_para }}</p>
            </div>
          </div>
          
          <div class="config-card" v-if="workflow.notificacoes_config">
            <h3>
              <i class="lucide-bell"></i>
              Notificações
            </h3>
            <div class="config-details">
              <p v-if="workflow.notificacoes_config.email">
                <i class="lucide-mail"></i> Email habilitado
              </p>
              <p v-if="workflow.notificacoes_config.sistema">
                <i class="lucide-monitor"></i> Sistema habilitado
              </p>
            </div>
          </div>
          
          <div class="config-card">
            <h3>
              <i class="lucide-shield"></i>
              Permissões
            </h3>
            <div class="config-details">
              <p><strong>Público:</strong> {{ workflow.publico ? 'Sim' : 'Não' }}</p>
              <p><strong>Criador:</strong> {{ workflow.user_id }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Instâncias Recentes -->
      <div class="instances-section">
        <div class="section-header">
          <h2>
            <i class="lucide-history"></i>
            Instâncias Recentes
          </h2>
          <button class="btn btn-outline btn-sm" @click="loadInstances">
            <i class="lucide-refresh-cw"></i>
            Atualizar
          </button>
        </div>
        <div class="instances-list" v-if="instances.length > 0">
          <div 
            v-for="instance in instances" 
            :key="instance.id"
            class="instance-item"
            @click="viewInstance(instance)"
          >
            <div class="instance-info">
              <h4>Instância #{{ instance.id }}</h4>
              <p>{{ instance.titulo || 'Sem título' }}</p>
            </div>
            <div class="instance-status">
              <span class="status-badge" :class="`status-${instance.status}`">
                {{ instance.status }}
              </span>
              <small>{{ formatDate(instance.created_at) }}</small>
            </div>
          </div>
        </div>
        <div class="empty-instances" v-else>
          <p>Nenhuma instância encontrada para este workflow.</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <p>Carregando workflow...</p>
    </div>

    <!-- Error -->
    <div class="error-state" v-if="error">
      <div class="error-icon">
        <i class="lucide-alert-circle"></i>
      </div>
      <h3>Erro ao carregar workflow</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadWorkflow">
        <i class="lucide-refresh-cw"></i>
        Tentar Novamente
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Estado reativo
const workflow = ref(null)
const instances = ref([])
const loading = ref(false)
const error = ref(null)

// Computed
const canEditWorkflow = computed(() => {
  if (!workflow.value) return false
  
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
  return workflow.value.user_id === authStore.user?.id
})

const canCreateInstance = computed(() => {
  if (!workflow.value || !workflow.value.ativo) return false
  
  const roleLevel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return roleLevel[authStore.user?.perfil] >= 2
})

// Métodos
const loadWorkflow = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await api.get(`/workflows/${route.params.id}`)
    workflow.value = response.data.workflow
    
    // Carregar instâncias
    await loadInstances()
    
  } catch (err) {
    console.error('Erro ao carregar workflow:', err)
    error.value = err.response?.data?.message || 'Erro ao carregar workflow'
  } finally {
    loading.value = false
  }
}

const loadInstances = async () => {
  try {
    const response = await api.get(`/workflows/${route.params.id}/instances`, {
      params: { limit: 10 }
    })
    instances.value = response.data.instances || []
  } catch (err) {
    console.error('Erro ao carregar instâncias:', err)
    instances.value = []
  }
}

const editWorkflow = () => {
  router.push(`/workflows/${workflow.value.id}/edit`)
}

const duplicateWorkflow = async () => {
  try {
    const response = await api.post(`/workflows/${workflow.value.id}/duplicate`)
    if (response.data.success) {
      router.push(`/workflows/${response.data.data.id}/edit`)
    }
  } catch (err) {
    console.error('Erro ao duplicar workflow:', err)
  }
}

const createInstance = () => {
  router.push({
    path: '/workflow-instances/create',
    query: { workflow: workflow.value.id }
  })
}

const viewInstance = (instance) => {
  router.push(`/workflow-instances/${instance.id}`)
}

const getEstadoNome = (estadoId) => {
  const estado = workflow.value?.estados?.find(e => e.id === estadoId)
  return estado?.nome || estadoId
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

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDepartmentName = (departmentId) => {
  // TODO: Implementar busca do nome do departamento
  return `Departamento ${departmentId}`
}

// Lifecycle
onMounted(() => {
  loadWorkflow()
})
</script>

<style scoped>
.workflow-detail-page {
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
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.workflow-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.category-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
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

.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-content > div {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  font-size: 1.5rem;
  margin: 0;
}

.info-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-card {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.info-card h3 {
  color: var(--primary-color);
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.info-card p {
  color: var(--text-secondary);
  margin: 0;
}

.flow-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.workflow-flow {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  position: relative;
}

.flow-step.initial {
  background: rgba(52, 152, 219, 0.1);
  border-left: 4px solid #3498db;
}

.flow-step.final {
  background: rgba(46, 204, 113, 0.1);
  border-left: 4px solid #2ecc71;
}

.step-icon {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.step-content p {
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.step-meta {
  display: flex;
  gap: 0.5rem;
}

.step-type {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-secondary);
}

.step-type.initial {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.step-type.final {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.step-arrow {
  color: var(--text-secondary);
  font-size: 1.5rem;
}

.transitions-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.transitions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.transition-card {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.transition-flow {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.state-from,
.state-to {
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.arrow {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.transition-details h4 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.transition-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
}

.meta-tag.approval {
  background: rgba(230, 126, 34, 0.1);
  color: #e67e22;
}

.meta-tag.automatic {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
}

.approval-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.approval-levels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.approval-level {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.level-number {
  width: 50px;
  height: 50px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}

.level-content {
  flex: 1;
}

.level-content h4 {
  color: var(--primary-color);
  margin-bottom: 0.75rem;
}

.level-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.config-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.config-card {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.config-card h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.config-details p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.instances-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.instances-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.instance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.instance-item:hover {
  background: rgba(52, 152, 219, 0.05);
  transform: translateX(4px);
}

.instance-info h4 {
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.instance-info p {
  color: var(--text-secondary);
  margin: 0;
}

.instance-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.empty-instances {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.error-icon {
  font-size: 4rem;
  color: #e74c3c;
  margin-bottom: 1rem;
}

.error-state h3 {
  color: #e74c3c;
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .workflow-detail-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .workflow-meta {
    justify-content: flex-start;
  }
  
  .info-grid,
  .config-grid,
  .transitions-grid {
    grid-template-columns: 1fr;
  }
  
  .workflow-flow {
    align-items: stretch;
  }
  
  .flow-step {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  
  .step-arrow {
    align-self: center;
    transform: rotate(90deg);
    margin: 0.5rem 0;
  }
  
  .transition-flow {
    flex-direction: column;
    text-align: center;
  }
  
  .arrow {
    transform: rotate(90deg);
  }
  
  .approval-level {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  
  .level-details {
    grid-template-columns: 1fr;
  }
  
  .instance-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .instance-status {
    align-items: flex-start;
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

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
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
</style>