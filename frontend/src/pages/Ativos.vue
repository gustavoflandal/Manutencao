<template>
  <div class="ativos-page">
    <header class="page-header">
      <h1>Gestão de Ativos</h1>
      
      <button 
        v-if="podeGerenciarAtivos" 
        class="btn btn-create" 
        @click="abrirModalCadastro()"
      >
        <i class="fas fa-plus"></i>
        Novo Ativo
      </button>
    </header>

    <!-- Dashboard de Estatísticas -->
    <div class="dashboard-cards">
      <div class="card">
        <h3>Total de Ativos</h3>
        <div class="card-stats">
          <span class="stats-number" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.total }}
          </span>
          <span class="stats-label">Cadastrados</span>
        </div>
      </div>

      <div class="card">
        <h3>Operacionais</h3>
        <div class="card-stats">
          <span class="stats-number text-success" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.operacional }}
          </span>
          <span class="stats-label">Em funcionamento</span>
        </div>
      </div>

      <div class="card">
        <h3>Em Manutenção</h3>
        <div class="card-stats">
          <span class="stats-number text-warning" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.manutencao }}
          </span>
          <span class="stats-label">Sendo reparados</span>
        </div>
      </div>

      <div class="card">
        <h3>Criticidade Alta</h3>
        <div class="card-stats">
          <span class="stats-number text-danger" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.critica }}
          </span>
          <span class="stats-label">Requer atenção</span>
        </div>
      </div>
    </div>

    <div class="ativos-content">
      <!-- Filtros -->
      <div class="ativos-filters">
        <input 
          v-model="filtros.busca" 
          type="text" 
          placeholder="Buscar por código ou nome..."
          class="form-input"
        />
        
        <select v-model="filtros.estado" class="form-select">
          <option value="">Todos os estados</option>
          <option value="operacional">Operacional</option>
          <option value="manutencao">Em Manutenção</option>
          <option value="parado">Parado</option>
          <option value="descartado">Descartado</option>
        </select>
        
        <select v-model="filtros.criticidade" class="form-select">
          <option value="">Todas as criticidades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
        
        <select v-model="filtros.setor_id" class="form-select">
          <option value="">Todos os setores</option>
          <option v-for="setor in setores" :key="setor.id" :value="setor.id">
            {{ setor.codigo }} - {{ setor.nome }}
          </option>
        </select>
      </div>

      <!-- Tabela de Ativos -->
      <div class="ativos-table">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Setor</th>
              <th>Localização</th>
              <th>Estado</th>
              <th>Criticidade</th>
              <th v-if="podeGerenciarAtivos">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ativo in ativosFiltrados" :key="ativo.id">
              <td>
                <strong>{{ ativo.codigo_patrimonio }}</strong>
              </td>
              <td>{{ ativo.nome }}</td>
              <td>
                <span v-if="ativo.setor" class="setor-badge">
                  {{ ativo.setor.codigo }}
                </span>
                <span v-else class="text-gray">Sem setor</span>
              </td>
              <td>{{ ativo.localizacao || 'Não informado' }}</td>
              <td>
                <span class="status-badge" :class="getEstadoClass(ativo.estado)">
                  {{ formatarEstado(ativo.estado) }}
                </span>
              </td>
              <td>
                <span class="criticidade-badge" :class="getCriticidadeClass(ativo.criticidade)">
                  {{ formatarCriticidade(ativo.criticidade) }}
                </span>
              </td>
              <td v-if="podeGerenciarAtivos">
                <div class="action-buttons">
                  <button 
                    class="btn btn-edit btn-sm" 
                    @click="editarAtivo(ativo)"
                    title="Editar ativo"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="btn btn-view btn-sm" 
                    @click="visualizarAtivo(ativo)"
                    title="Visualizar ativo"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button 
                    v-if="podeExcluirAtivos"
                    class="btn btn-delete btn-sm" 
                    @click="excluirAtivo(ativo)"
                    title="Excluir ativo"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="ativosFiltrados.length === 0">
              <td :colspan="podeGerenciarAtivos ? 7 : 6" class="no-data">
                {{ carregando ? 'Carregando ativos...' : 'Nenhum ativo encontrado' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Cadastro/Edição -->
    <div v-if="modalAberto" class="modal-overlay" @click="fecharModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>{{ ativoEdicao ? 'Editar Ativo' : 'Novo Ativo' }}</h2>
          <button @click="fecharModal" class="modal-close">&times;</button>
        </div>
        
        <form @submit.prevent="salvarAtivo" class="modal-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Código do Patrimônio*</label>
              <input 
                v-model="formulario.codigo_patrimonio" 
                type="text" 
                required
                :disabled="!!ativoEdicao"
                class="form-input"
                placeholder="Ex: AT001"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Nome do Ativo*</label>
              <input 
                v-model="formulario.nome" 
                type="text" 
                required
                class="form-input"
                placeholder="Ex: Compressor de Ar"
              />
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Setor*</label>
              <select v-model="formulario.setor_id" required class="form-input">
                <option value="">Selecione o setor</option>
                <option v-for="setor in setores" :key="setor.id" :value="setor.id">
                  {{ setor.codigo }} - {{ setor.nome }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Estado*</label>
              <select v-model="formulario.estado" required class="form-input">
                <option value="">Selecione o estado</option>
                <option value="operacional">Operacional</option>
                <option value="manutencao">Em Manutenção</option>
                <option value="parado">Parado</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Criticidade*</label>
              <select v-model="formulario.criticidade" required class="form-input">
                <option value="">Selecione a criticidade</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Localização</label>
              <input 
                v-model="formulario.localizacao" 
                type="text" 
                class="form-input"
                placeholder="Ex: Setor A - Linha 1 - Posição 3"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <textarea 
              v-model="formulario.descricao" 
              class="form-input"
              rows="3"
              placeholder="Descrição detalhada do ativo..."
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="fecharModal" class="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="salvando">
              {{ salvando ? 'Salvando...' : 'Salvar Ativo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const authStore = useAuthStore()
const { success, error } = useToast()

// Estados reativos
const ativos = ref([])
const setores = ref([])
const stats = ref({
  total: 0,
  operacional: 0,
  manutencao: 0,
  critica: 0
})
const carregando = ref(false)
const modalAberto = ref(false)
const ativoEdicao = ref(null)
const salvando = ref(false)

// Filtros
const filtros = ref({
  busca: '',
  estado: '',
  criticidade: '',
  setor_id: ''
})

// Formulário
const formulario = ref({
  codigo_patrimonio: '',
  nome: '',
  estado: '',
  criticidade: '',
  setor_id: '',
  localizacao: '',
  descricao: '',
  departamento_id: 1
})

// Computed properties
const podeGerenciarAtivos = computed(() => {
  const nivel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return nivel[authStore.user?.perfil] >= 2
})

const podeExcluirAtivos = computed(() => {
  const nivel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return nivel[authStore.user?.perfil] >= 3
})

const ativosFiltrados = computed(() => {
  let filtrados = ativos.value

  if (filtros.value.busca) {
    const busca = filtros.value.busca.toLowerCase()
    filtrados = filtrados.filter(ativo => 
      ativo.codigo_patrimonio.toLowerCase().includes(busca) ||
      ativo.nome.toLowerCase().includes(busca)
    )
  }

  if (filtros.value.estado) {
    filtrados = filtrados.filter(ativo => ativo.estado === filtros.value.estado)
  }

  if (filtros.value.criticidade) {
    filtrados = filtrados.filter(ativo => ativo.criticidade === filtros.value.criticidade)
  }

  if (filtros.value.setor_id) {
    filtrados = filtrados.filter(ativo => ativo.setor_id == filtros.value.setor_id)
  }

  return filtrados
})

// Métodos
const carregarAtivos = async () => {
  try {
    carregando.value = true
    const response = await api.get('/ativos')
    
    if (response.data.success) {
      ativos.value = response.data.data.ativos || []
      calcularEstatisticas()
    }
  } catch (err) {
    console.error('Erro ao carregar ativos:', err)
    error('Erro', 'Não foi possível carregar os ativos')
  } finally {
    carregando.value = false
  }
}

const carregarSetores = async () => {
  try {
    const response = await api.get('/setores/ativos')
    if (response.data.success) {
      setores.value = response.data.data.setores || []
    }
  } catch (err) {
    console.error('Erro ao carregar setores:', err)
  }
}

const calcularEstatisticas = () => {
  const total = ativos.value.length
  const operacional = ativos.value.filter(a => a.estado === 'operacional').length
  const manutencao = ativos.value.filter(a => a.estado === 'manutencao').length
  const critica = ativos.value.filter(a => a.criticidade === 'critica' || a.criticidade === 'alta').length

  stats.value = { total, operacional, manutencao, critica }
}

const formatarEstado = (estado) => {
  const estados = {
    'operacional': 'Operacional',
    'manutencao': 'Em Manutenção',
    'parado': 'Parado',
    'descartado': 'Descartado'
  }
  return estados[estado] || estado
}

const formatarCriticidade = (criticidade) => {
  const criticidades = {
    'baixa': 'Baixa',
    'media': 'Média',
    'alta': 'Alta',
    'critica': 'Crítica'
  }
  return criticidades[criticidade] || criticidade
}

const getEstadoClass = (estado) => {
  return {
    'operacional': 'active',
    'manutencao': 'warning',
    'parado': 'danger',
    'descartado': 'inactive'
  }[estado] || ''
}

const getCriticidadeClass = (criticidade) => {
  return criticidade
}

const abrirModalCadastro = () => {
  ativoEdicao.value = null
  formulario.value = {
    codigo_patrimonio: '',
    nome: '',
    estado: '',
    criticidade: '',
    setor_id: '',
    localizacao: '',
    descricao: '',
    departamento_id: 1
  }
  modalAberto.value = true
}

const editarAtivo = (ativo) => {
  ativoEdicao.value = ativo
  formulario.value = {
    codigo_patrimonio: ativo.codigo_patrimonio,
    nome: ativo.nome,
    estado: ativo.estado,
    criticidade: ativo.criticidade,
    setor_id: ativo.setor_id || '',
    localizacao: ativo.localizacao || '',
    descricao: ativo.descricao || '',
    departamento_id: ativo.departamento_id || 1
  }
  modalAberto.value = true
}

const visualizarAtivo = (ativo) => {
  alert(`Ativo: ${ativo.codigo_patrimonio}\nNome: ${ativo.nome}\nEstado: ${formatarEstado(ativo.estado)}\nCriticidade: ${formatarCriticidade(ativo.criticidade)}`)
}

const excluirAtivo = async (ativo) => {
  if (!confirm(`Deseja realmente excluir o ativo ${ativo.codigo_patrimonio}?`)) {
    return
  }

  try {
    await api.delete(`/ativos/${ativo.id}`)
    success('Sucesso', 'Ativo excluído com sucesso')
    await carregarAtivos()
  } catch (err) {
    console.error('Erro ao excluir ativo:', err)
    error('Erro', 'Não foi possível excluir o ativo')
  }
}

const salvarAtivo = async () => {
  try {
    salvando.value = true
    
    if (ativoEdicao.value) {
      await api.put(`/ativos/${ativoEdicao.value.id}`, formulario.value)
      success('Sucesso', 'Ativo atualizado com sucesso')
    } else {
      await api.post('/ativos', formulario.value)
      success('Sucesso', 'Ativo cadastrado com sucesso')
    }
    
    fecharModal()
    await carregarAtivos()
  } catch (err) {
    console.error('Erro ao salvar ativo:', err)
    error('Erro', 'Não foi possível salvar o ativo')
  } finally {
    salvando.value = false
  }
}

const fecharModal = () => {
  modalAberto.value = false
  ativoEdicao.value = null
}

// Watchers para filtros
watch([() => filtros.value.busca, () => filtros.value.estado, () => filtros.value.criticidade], () => {
  // Os filtros são reativos através do computed ativosFiltrados
}, { deep: true })

// Lifecycle
onMounted(() => {
  carregarAtivos()
  carregarSetores()
})
</script>

<style scoped>
.ativos-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--color-primary);
  font-size: 2rem;
  margin: 0;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.card {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-light-gray);
}

.card h3 {
  color: var(--color-primary);
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.card-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-secondary);
  line-height: 1;
  transition: opacity 0.3s ease;
}

.stats-number.loading {
  opacity: 0.5;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.stats-label {
  color: var(--color-dark-gray);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.ativos-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.form-input,
.form-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-light-gray);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  background: var(--color-white);
}

.form-input {
  min-width: 300px;
  flex: 1;
}

.form-select {
  min-width: 200px;
}

.ativos-table {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-light-gray);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: var(--color-primary);
  color: var(--color-white);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-light-gray);
}

tr:last-child td {
  border-bottom: none;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.warning {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.danger {
  background: #ffebee;
  color: #d32f2f;
}

.status-badge.inactive {
  background: #f5f5f5;
  color: #666;
}

.criticidade-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.criticidade-badge.baixa {
  background: #e8f5e8;
  color: #2e7d32;
}

.criticidade-badge.media {
  background: #e3f2fd;
  color: #1976d2;
}

.criticidade-badge.alta {
  background: #fff3e0;
  color: #f57c00;
}

.criticidade-badge.critica {
  background: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.no-data {
  text-align: center;
  color: var(--color-dark-gray);
  padding: 2rem;
  font-style: italic;
}

.setor-badge {
  padding: 0.2rem 0.6rem;
  background: var(--color-light);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
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

.modal-container {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-light-gray);
}

.modal-header h2 {
  color: var(--color-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-dark-gray);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: var(--color-light-gray);
}

.modal-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-dark);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-light-gray);
}

@media (max-width: 768px) {
  .ativos-page {
    padding: 1rem;
  }
  
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
  
  .ativos-filters {
    flex-direction: column;
  }
  
  .form-input {
    min-width: auto;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    width: 95%;
    margin: 1rem;
  }
}
</style>