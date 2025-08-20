<template>
  <div class="ordens-servico-page">
    <!-- Cabeçalho -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">
            <i class="icon-wrench"></i>
            Ordens de Serviço
          </h1>
          <p class="page-subtitle">
            Gerencie as ordens de serviço de manutenção
          </p>
        </div>
        <button 
          @click="abrirModalCriar" 
          class="btn btn-create"
          v-if="canCreate"
        >
          <i class="icon-plus"></i>
          Nova OS
        </button>
      </div>
    </div>

    <!-- Estatísticas -->
    <div class="stats-grid" v-if="statistics">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="icon-list"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.total || 0 }}</h3>
          <p>Total de OS</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon em-execucao">
          <i class="icon-play"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.por_status?.em_execucao || 0 }}</h3>
          <p>Em Execução</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon planejadas">
          <i class="icon-calendar"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.por_status?.planejadas || 0 }}</h3>
          <p>Planejadas</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon atrasadas">
          <i class="icon-alert-triangle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.atrasadas || 0 }}</h3>
          <p>Atrasadas</p>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label>Status</label>
          <select v-model="filtros.status" @change="buscarOS">
            <option value="">Todos</option>
            <option value="planejada">Planejada</option>
            <option value="em_execucao">Em Execução</option>
            <option value="pausada">Pausada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Prioridade</label>
          <select v-model="filtros.prioridade" @change="buscarOS">
            <option value="">Todas</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Tipo</label>
          <select v-model="filtros.tipo" @change="buscarOS">
            <option value="">Todos</option>
            <option value="corretiva">Corretiva</option>
            <option value="preventiva">Preventiva</option>
            <option value="preditiva">Preditiva</option>
            <option value="melhoria">Melhoria</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Buscar</label>
          <input 
            type="text" 
            v-model="filtros.search" 
            @input="debounceSearch"
            placeholder="Número, descrição..."
            class="search-input"
          >
        </div>
      </div>
    </div>

    <!-- Lista de OS -->
    <div class="content-card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Ativo</th>
              <th>Tipo</th>
              <th>Prioridade</th>
              <th>Status</th>
              <th>Responsável</th>
              <th>Data Prevista</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="loading-cell">
                <div class="loading-spinner"></div>
                Carregando...
              </td>
            </tr>
            <tr v-else-if="ordens.length === 0">
              <td colspan="8" class="empty-cell">
                <i class="icon-inbox"></i>
                <p>Nenhuma ordem de serviço encontrada</p>
              </td>
            </tr>
            <tr v-else v-for="os in ordens" :key="os.id" class="table-row">
              <td>
                <span class="os-numero">{{ os.numero_os }}</span>
              </td>
              <td>
                <div class="ativo-info">
                  <strong>{{ os.ativo?.codigo }}</strong>
                  <span>{{ os.ativo?.nome }}</span>
                </div>
              </td>
              <td>
                <span class="tipo-badge" :class="os.tipo">
                  {{ formatarTipo(os.tipo) }}
                </span>
              </td>
              <td>
                <span class="prioridade-badge" :class="os.prioridade">
                  {{ formatarPrioridade(os.prioridade) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="os.status">
                  {{ formatarStatus(os.status) }}
                </span>
              </td>
              <td>
                <div class="responsavel-info" v-if="os.responsavel">
                  {{ os.responsavel.nome }}
                </div>
                <span v-else class="sem-responsavel">Não atribuído</span>
              </td>
              <td>
                <div class="data-info">
                  {{ formatarData(os.data_inicio_prevista) }}
                  <span v-if="isAtrasada(os)" class="atrasada">
                    <i class="icon-alert-triangle"></i>
                    Atrasada
                  </span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    @click="visualizarOS(os)" 
                    class="btn btn-view"
                    title="Visualizar"
                  >
                    <i class="icon-eye"></i>
                  </button>
                  <button 
                    @click="editarOS(os)" 
                    class="btn btn-edit"
                    title="Editar"
                    v-if="canEdit"
                  >
                    <i class="icon-edit"></i>
                  </button>
                  <button 
                    @click="alterarStatus(os)" 
                    class="btn btn-status"
                    title="Alterar Status"
                    v-if="canEdit"
                  >
                    <i class="icon-settings"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div class="pagination" v-if="pagination.total_pages > 1">
        <button 
          @click="mudarPagina(pagination.current_page - 1)"
          :disabled="pagination.current_page === 1"
          class="btn btn-pagination"
        >
          <i class="icon-chevron-left"></i>
          Anterior
        </button>
        
        <span class="pagination-info">
          Página {{ pagination.current_page }} de {{ pagination.total_pages }}
          ({{ pagination.total }} registros)
        </span>
        
        <button 
          @click="mudarPagina(pagination.current_page + 1)"
          :disabled="pagination.current_page === pagination.total_pages"
          class="btn btn-pagination"
        >
          Próxima
          <i class="icon-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal de Criar/Editar OS -->
    <div class="modal-overlay" v-if="modalCriarAberto" @click="fecharModalCriar">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>{{ osEditando ? 'Editar' : 'Nova' }} Ordem de Serviço</h2>
          <button @click="fecharModalCriar" class="btn btn-close">
            <i class="icon-x"></i>
          </button>
        </div>
        
        <form @submit.prevent="salvarOS" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Ativo *</label>
              <select v-model="formOS.ativo_id" required :disabled="osEditando">
                <option value="">Selecione um ativo</option>
                <option v-for="ativo in ativos" :key="ativo.id" :value="ativo.id">
                  {{ ativo.codigo }} - {{ ativo.nome }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Tipo *</label>
              <select v-model="formOS.tipo" required>
                <option value="corretiva">Corretiva</option>
                <option value="preventiva">Preventiva</option>
                <option value="preditiva">Preditiva</option>
                <option value="melhoria">Melhoria</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Prioridade</label>
              <select v-model="formOS.prioridade">
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Responsável</label>
              <select v-model="formOS.responsavel_id">
                <option value="">Selecione um responsável</option>
                <option v-for="user in tecnicos" :key="user.id" :value="user.id">
                  {{ user.nome }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Data Início Prevista</label>
              <input type="datetime-local" v-model="formOS.data_inicio_prevista">
            </div>
            
            <div class="form-group">
              <label>Data Fim Prevista</label>
              <input type="datetime-local" v-model="formOS.data_fim_prevista">
            </div>
            
            <div class="form-group">
              <label>Horas Planejadas</label>
              <input type="number" step="0.5" v-model="formOS.horas_planejadas" min="0">
            </div>
          </div>
          
          <div class="form-group full-width">
            <label>Descrição do Serviço *</label>
            <textarea 
              v-model="formOS.descricao_servico" 
              required
              rows="4"
              placeholder="Descreva o serviço a ser realizado..."
            ></textarea>
          </div>
          
          <div class="form-group full-width">
            <label>Observações</label>
            <textarea 
              v-model="formOS.observacoes_execucao" 
              rows="3"
              placeholder="Observações adicionais..."
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="fecharModalCriar" class="btn btn-cancel">
              Cancelar
            </button>
            <button type="submit" class="btn btn-save" :disabled="salvandoOS">
              <i class="icon-save" v-if="!salvandoOS"></i>
              <div class="loading-spinner small" v-if="salvandoOS"></div>
              {{ salvandoOS ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Alterar Status -->
    <div class="modal-overlay" v-if="modalStatusAberto" @click="fecharModalStatus">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Alterar Status - {{ osStatus?.numero_os }}</h2>
          <button @click="fecharModalStatus" class="btn btn-close">
            <i class="icon-x"></i>
          </button>
        </div>
        
        <form @submit.prevent="salvarStatus" class="modal-body">
          <div class="form-group">
            <label>Status Atual</label>
            <span class="status-badge" :class="osStatus?.status">
              {{ formatarStatus(osStatus?.status) }}
            </span>
          </div>
          
          <div class="form-group">
            <label>Novo Status</label>
            <select v-model="formStatus.status" required>
              <option value="em_execucao">Em Execução</option>
              <option value="pausada">Pausada</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          
          <div class="form-group" v-if="formStatus.status === 'concluida'">
            <label>Horas Realizadas</label>
            <input type="number" step="0.5" v-model="formStatus.horas_realizadas" min="0">
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="fecharModalStatus" class="btn btn-cancel">
              Cancelar
            </button>
            <button type="submit" class="btn btn-save" :disabled="salvandoStatus">
              <i class="icon-save" v-if="!salvandoStatus"></i>
              <div class="loading-spinner small" v-if="salvandoStatus"></div>
              {{ salvandoStatus ? 'Salvando...' : 'Alterar Status' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

// Estados reativo
const loading = ref(false)
const ordens = ref([])
const statistics = ref(null)
const ativos = ref([])
const tecnicos = ref([])
const pagination = ref({
  current_page: 1,
  per_page: 20,
  total: 0,
  total_pages: 0
})

// Filtros
const filtros = reactive({
  status: '',
  prioridade: '',
  tipo: '',
  search: ''
})

// Modal de criar/editar
const modalCriarAberto = ref(false)
const osEditando = ref(null)
const salvandoOS = ref(false)
const formOS = reactive({
  ativo_id: '',
  tipo: 'corretiva',
  prioridade: 'normal',
  responsavel_id: '',
  descricao_servico: '',
  data_inicio_prevista: '',
  data_fim_prevista: '',
  horas_planejadas: 0,
  observacoes_execucao: ''
})

// Modal de status
const modalStatusAberto = ref(false)
const osStatus = ref(null)
const salvandoStatus = ref(false)
const formStatus = reactive({
  status: '',
  horas_realizadas: 0
})

// Permissões
const canCreate = computed(() => {
  const perfil = authStore.user?.perfil
  return ['administrador', 'supervisor', 'tecnico'].includes(perfil)
})

const canEdit = computed(() => {
  const perfil = authStore.user?.perfil
  return ['administrador', 'supervisor', 'tecnico'].includes(perfil)
})

// Debounce para busca
let searchTimeout = null
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(buscarOS, 500)
}

// Métodos
const buscarOS = async (page = 1) => {
  try {
    loading.value = true
    
    const params = {
      page,
      limit: pagination.value.per_page,
      ...filtros
    }
    
    // Remover parâmetros vazios
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })
    
    const response = await api.get('/ordens-servico', { params })
    
    if (response.data.success) {
      ordens.value = response.data.data
      pagination.value = response.data.pagination
      if (response.data.statistics) {
        statistics.value = response.data.statistics
      }
    }
  } catch (error) {
    console.error('Erro ao buscar OS:', error)
    ordens.value = []
  } finally {
    loading.value = false
  }
}

const buscarEstatisticas = async () => {
  try {
    const response = await api.get('/ordens-servico/statistics')
    if (response.data.success) {
      statistics.value = response.data.data
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
  }
}

const buscarAtivos = async () => {
  try {
    const response = await api.get('/ativos')
    if (response.data.success) {
      ativos.value = response.data.data
    }
  } catch (error) {
    console.error('Erro ao buscar ativos:', error)
    ativos.value = []
  }
}

const buscarTecnicos = async () => {
  try {
    const response = await api.get('/users?perfil=tecnico,supervisor,administrador')
    if (response.data.success) {
      tecnicos.value = response.data.data
    }
  } catch (error) {
    console.error('Erro ao buscar técnicos:', error)
    tecnicos.value = []
  }
}

const mudarPagina = (page) => {
  if (page >= 1 && page <= pagination.value.total_pages) {
    buscarOS(page)
  }
}

const abrirModalCriar = () => {
  osEditando.value = null
  Object.assign(formOS, {
    ativo_id: '',
    tipo: 'corretiva',
    prioridade: 'normal',
    responsavel_id: '',
    descricao_servico: '',
    data_inicio_prevista: '',
    data_fim_prevista: '',
    horas_planejadas: 0,
    observacoes_execucao: ''
  })
  modalCriarAberto.value = true
}

const editarOS = (os) => {
  osEditando.value = os
  Object.assign(formOS, {
    ativo_id: os.ativo_id,
    tipo: os.tipo,
    prioridade: os.prioridade,
    responsavel_id: os.responsavel_id,
    descricao_servico: os.descricao_servico,
    data_inicio_prevista: os.data_inicio_prevista ? formatarDataInput(os.data_inicio_prevista) : '',
    data_fim_prevista: os.data_fim_prevista ? formatarDataInput(os.data_fim_prevista) : '',
    horas_planejadas: os.horas_planejadas,
    observacoes_execucao: os.observacoes_execucao
  })
  modalCriarAberto.value = true
}

const fecharModalCriar = () => {
  modalCriarAberto.value = false
  osEditando.value = null
}

const salvarOS = async () => {
  try {
    salvandoOS.value = true
    
    let response
    if (osEditando.value) {
      response = await api.put(`/ordens-servico/${osEditando.value.id}`, formOS)
    } else {
      response = await api.post('/ordens-servico', formOS)
    }
    
    if (response.data.success) {
      fecharModalCriar()
      await buscarOS(pagination.value.current_page)
      await buscarEstatisticas()
    }
  } catch (error) {
    console.error('Erro ao salvar OS:', error)
    alert('Erro ao salvar ordem de serviço')
  } finally {
    salvandoOS.value = false
  }
}

const alterarStatus = (os) => {
  osStatus.value = os
  formStatus.status = ''
  formStatus.horas_realizadas = 0
  modalStatusAberto.value = true
}

const fecharModalStatus = () => {
  modalStatusAberto.value = false
  osStatus.value = null
}

const salvarStatus = async () => {
  try {
    salvandoStatus.value = true
    
    const response = await api.patch(`/ordens-servico/${osStatus.value.id}/status`, formStatus)
    
    if (response.data.success) {
      fecharModalStatus()
      await buscarOS(pagination.value.current_page)
      await buscarEstatisticas()
    }
  } catch (error) {
    console.error('Erro ao alterar status:', error)
    alert('Erro ao alterar status da OS')
  } finally {
    salvandoStatus.value = false
  }
}

const visualizarOS = (os) => {
  router.push(`/ordens-servico/${os.id}`)
}

// Formatadores
const formatarTipo = (tipo) => {
  const tipos = {
    corretiva: 'Corretiva',
    preventiva: 'Preventiva',
    preditiva: 'Preditiva',
    melhoria: 'Melhoria'
  }
  return tipos[tipo] || tipo
}

const formatarPrioridade = (prioridade) => {
  const prioridades = {
    baixa: 'Baixa',
    normal: 'Normal',
    alta: 'Alta',
    critica: 'Crítica'
  }
  return prioridades[prioridade] || prioridade
}

const formatarStatus = (status) => {
  const statuses = {
    planejada: 'Planejada',
    em_execucao: 'Em Execução',
    pausada: 'Pausada',
    concluida: 'Concluída',
    cancelada: 'Cancelada'
  }
  return statuses[status] || status
}

const formatarData = (data) => {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatarDataInput = (data) => {
  if (!data) return ''
  const date = new Date(data)
  return date.toISOString().slice(0, 16)
}

const isAtrasada = (os) => {
  if (!os.data_inicio_prevista || ['concluida', 'cancelada'].includes(os.status)) {
    return false
  }
  return new Date(os.data_inicio_prevista) < new Date()
}

// Inicialização
onMounted(async () => {
  await Promise.all([
    buscarOS(),
    buscarEstatisticas(),
    buscarAtivos(),
    buscarTecnicos()
  ])
})
</script>

<style scoped>
.ordens-servico-page {
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title i {
  color: #3498db;
}

.page-subtitle {
  color: #7f8c8d;
  margin: 0.5rem 0 0 0;
}

/* Estatísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-icon.total { background: #3498db; }
.stat-icon.em-execucao { background: #f39c12; }
.stat-icon.planejadas { background: #2ecc71; }
.stat-icon.atrasadas { background: #e74c3c; }

.stat-content h3 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
}

.stat-content p {
  color: #7f8c8d;
  margin: 0;
}

/* Filtros */
.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #2c3e50;
}

.filter-group select,
.search-input {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.filter-group select:focus,
.search-input:focus {
  outline: none;
  border-color: #3498db;
}

/* Tabela */
.content-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.table-row:hover {
  background: #f8f9fa;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.empty-cell i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #bdc3c7;
}

/* Badges */
.os-numero {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #2c3e50;
}

.ativo-info strong {
  display: block;
  color: #2c3e50;
}

.ativo-info span {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.tipo-badge,
.prioridade-badge,
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

/* Tipos */
.tipo-badge.corretiva { background: #fee; color: #dc3545; }
.tipo-badge.preventiva { background: #efe; color: #28a745; }
.tipo-badge.preditiva { background: #fef; color: #6f42c1; }
.tipo-badge.melhoria { background: #eff; color: #17a2b8; }

/* Prioridades */
.prioridade-badge.baixa { background: #e8f5e8; color: #28a745; }
.prioridade-badge.normal { background: #e3f2fd; color: #2196f3; }
.prioridade-badge.alta { background: #fff3e0; color: #ff9800; }
.prioridade-badge.critica { background: #ffebee; color: #f44336; }

/* Status */
.status-badge.planejada { background: #e3f2fd; color: #2196f3; }
.status-badge.em_execucao { background: #fff3e0; color: #ff9800; }
.status-badge.pausada { background: #fafafa; color: #757575; }
.status-badge.concluida { background: #e8f5e8; color: #4caf50; }
.status-badge.cancelada { background: #ffebee; color: #f44336; }

.responsavel-info {
  color: #2c3e50;
}

.sem-responsavel {
  color: #7f8c8d;
  font-style: italic;
}

.data-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.atrasada {
  color: #e74c3c;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Ações */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-create {
  background: #28a745;
  color: white;
}

.btn-create:hover {
  background: #218838;
}

.btn-view {
  background: #17a2b8;
  color: white;
  padding: 0.5rem;
}

.btn-edit {
  background: #ffc107;
  color: #212529;
  padding: 0.5rem;
}

.btn-status {
  background: #6c757d;
  color: white;
  padding: 0.5rem;
}

.btn-pagination {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-close {
  background: #dc3545;
  color: white;
  padding: 0.5rem;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-save {
  background: #28a745;
  color: white;
}

/* Paginação */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.pagination-info {
  color: #6c757d;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
  margin-top: 1.5rem;
}

/* Loading */
.loading-spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .ordens-servico-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>