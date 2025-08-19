<template>
  <div class="setores-page">
    <header class="page-header">
      <h1>Gestão de Setores</h1>
      
      <button 
        v-if="podeGerenciarSetores" 
        class="btn btn-primary" 
        @click="abrirModalCadastro()"
      >
        Novo Setor
      </button>
    </header>

    <!-- Dashboard de Estatísticas -->
    <div class="dashboard-cards">
      <div class="card">
        <h3>Total de Setores</h3>
        <div class="card-stats">
          <span class="stats-number" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.total }}
          </span>
          <span class="stats-label">Cadastrados</span>
        </div>
      </div>

      <div class="card">
        <h3>Setores Ativos</h3>
        <div class="card-stats">
          <span class="stats-number text-success" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.ativos }}
          </span>
          <span class="stats-label">Funcionando</span>
        </div>
      </div>

      <div class="card">
        <h3>Com Responsável</h3>
        <div class="card-stats">
          <span class="stats-number text-info" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.comResponsavel }}
          </span>
          <span class="stats-label">Supervisionados</span>
        </div>
      </div>

      <div class="card">
        <h3>Total de Ativos</h3>
        <div class="card-stats">
          <span class="stats-number text-secondary" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.totalAtivos }}
          </span>
          <span class="stats-label">Distribuídos</span>
        </div>
      </div>
    </div>

    <div class="setores-content">
      <!-- Filtros -->
      <div class="setores-filters">
        <input 
          v-model="filtros.busca" 
          type="text" 
          placeholder="Buscar por código ou nome..."
          class="form-input"
        />
        
        <select v-model="filtros.ativo" class="form-select">
          <option value="">Todos os setores</option>
          <option value="true">Apenas ativos</option>
          <option value="false">Apenas inativos</option>
        </select>
        
        <select v-model="filtros.responsavel_id" class="form-select">
          <option value="">Todos os responsáveis</option>
          <option v-for="user in usuarios" :key="user.id" :value="user.id">
            {{ user.nome }}
          </option>
        </select>
      </div>

      <!-- Tabela de Setores -->
      <div class="setores-table">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Localização</th>
              <th>Responsável</th>
              <th>Ativos</th>
              <th>Status</th>
              <th v-if="podeGerenciarSetores">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="setor in setoresFiltrados" :key="setor.id">
              <td>
                <strong>{{ setor.codigo }}</strong>
              </td>
              <td>{{ setor.nome }}</td>
              <td>{{ setor.localizacao || 'Não informado' }}</td>
              <td>
                <span v-if="setor.responsavel">
                  {{ setor.responsavel.nome }}
                  <br>
                  <small class="text-gray">{{ setor.responsavel.email }}</small>
                </span>
                <span v-else class="text-gray">Sem responsável</span>
              </td>
              <td>
                <span v-if="setor.estatisticas" class="ativo-count">
                  {{ setor.estatisticas.total }}
                  <small v-if="setor.estatisticas.operacional > 0" class="text-success">
                    ({{ setor.estatisticas.operacional }} op.)
                  </small>
                </span>
                <span v-else class="text-gray">-</span>
              </td>
              <td>
                <span class="status-badge" :class="setor.ativo ? 'active' : 'inactive'">
                  {{ setor.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td v-if="podeGerenciarSetores">
                <div class="action-buttons">
                  <button 
                    class="btn btn-sm btn-secondary" 
                    @click="editarSetor(setor)"
                  >
                    Editar
                  </button>
                  <button 
                    class="btn btn-sm btn-info" 
                    @click="visualizarSetor(setor)"
                  >
                    Ver
                  </button>
                  <button 
                    v-if="podeExcluirSetores && (!setor.estatisticas || setor.estatisticas.total === 0)"
                    class="btn btn-sm btn-danger" 
                    @click="excluirSetor(setor)"
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="setoresFiltrados.length === 0">
              <td :colspan="podeGerenciarSetores ? 7 : 6" class="no-data">
                {{ carregando ? 'Carregando setores...' : 'Nenhum setor encontrado' }}
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
          <h2>{{ setorEdicao ? 'Editar Setor' : 'Novo Setor' }}</h2>
          <button @click="fecharModal" class="modal-close">&times;</button>
        </div>
        
        <form @submit.prevent="salvarSetor" class="modal-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Código do Setor*</label>
              <input 
                v-model="formulario.codigo" 
                type="text" 
                required
                :disabled="!!setorEdicao"
                class="form-input"
                placeholder="Ex: PROD, MANUT, ADM"
                style="text-transform: uppercase"
              />
              <small class="form-help">Usar apenas letras maiúsculas e números</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Nome do Setor*</label>
              <input 
                v-model="formulario.nome" 
                type="text" 
                required
                class="form-input"
                placeholder="Ex: Produção, Manutenção"
              />
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Localização</label>
              <input 
                v-model="formulario.localizacao" 
                type="text" 
                class="form-input"
                placeholder="Ex: Pavilhão A, Oficina Central"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Responsável</label>
              <select v-model="formulario.responsavel_id" class="form-input">
                <option value="">Selecione um responsável</option>
                <option v-for="user in usuarios" :key="user.id" :value="user.id">
                  {{ user.nome }} ({{ user.email }})
                </option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <textarea 
              v-model="formulario.descricao" 
              class="form-input"
              rows="3"
              placeholder="Descrição detalhada do setor..."
            ></textarea>
          </div>

          <div class="form-group" v-if="setorEdicao">
            <label class="form-check-label">
              <input 
                v-model="formulario.ativo" 
                type="checkbox"
                class="form-check-input"
              />
              Setor ativo
            </label>
            <small class="form-help text-warning" v-if="!formulario.ativo">
              Atenção: Setores inativos não poderão receber novos ativos
            </small>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="fecharModal" class="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="salvando">
              {{ salvando ? 'Salvando...' : 'Salvar Setor' }}
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
const setores = ref([])
const usuarios = ref([])
const stats = ref({
  total: 0,
  ativos: 0,
  comResponsavel: 0,
  totalAtivos: 0
})
const carregando = ref(false)
const modalAberto = ref(false)
const setorEdicao = ref(null)
const salvando = ref(false)

// Filtros
const filtros = ref({
  busca: '',
  ativo: '',
  responsavel_id: ''
})

// Formulário
const formulario = ref({
  codigo: '',
  nome: '',
  descricao: '',
  localizacao: '',
  responsavel_id: '',
  ativo: true
})

// Computed properties
const podeGerenciarSetores = computed(() => {
  const nivel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return nivel[authStore.user?.perfil] >= 3
})

const podeExcluirSetores = computed(() => {
  const nivel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return nivel[authStore.user?.perfil] >= 4
})

const setoresFiltrados = computed(() => {
  let filtrados = setores.value

  if (filtros.value.busca) {
    const busca = filtros.value.busca.toLowerCase()
    filtrados = filtrados.filter(setor => 
      setor.codigo.toLowerCase().includes(busca) ||
      setor.nome.toLowerCase().includes(busca) ||
      (setor.descricao && setor.descricao.toLowerCase().includes(busca))
    )
  }

  if (filtros.value.ativo !== '') {
    filtrados = filtrados.filter(setor => setor.ativo === (filtros.value.ativo === 'true'))
  }

  if (filtros.value.responsavel_id) {
    filtrados = filtrados.filter(setor => setor.responsavel_id == filtros.value.responsavel_id)
  }

  return filtrados
})

// Métodos
const carregarSetores = async () => {
  try {
    carregando.value = true
    const response = await api.get('/setores?incluir_estatisticas=true')
    
    if (response.data.success) {
      setores.value = response.data.data.setores || []
      calcularEstatisticas()
    }
  } catch (err) {
    console.error('Erro ao carregar setores:', err)
    error('Erro', 'Não foi possível carregar os setores')
  } finally {
    carregando.value = false
  }
}

const carregarUsuarios = async () => {
  try {
    const response = await api.get('/users?ativo=true')
    if (response.data.success) {
      usuarios.value = response.data.data.users || []
    }
  } catch (err) {
    console.error('Erro ao carregar usuários:', err)
  }
}

const calcularEstatisticas = () => {
  const total = setores.value.length
  const ativos = setores.value.filter(s => s.ativo).length
  const comResponsavel = setores.value.filter(s => s.responsavel_id).length
  const totalAtivos = setores.value.reduce((acc, setor) => {
    return acc + (setor.estatisticas ? setor.estatisticas.total : 0)
  }, 0)

  stats.value = { total, ativos, comResponsavel, totalAtivos }
}

const abrirModalCadastro = () => {
  setorEdicao.value = null
  formulario.value = {
    codigo: '',
    nome: '',
    descricao: '',
    localizacao: '',
    responsavel_id: '',
    ativo: true
  }
  modalAberto.value = true
}

const editarSetor = (setor) => {
  setorEdicao.value = setor
  formulario.value = {
    codigo: setor.codigo,
    nome: setor.nome,
    descricao: setor.descricao || '',
    localizacao: setor.localizacao || '',
    responsavel_id: setor.responsavel_id || '',
    ativo: setor.ativo
  }
  modalAberto.value = true
}

const visualizarSetor = (setor) => {
  const info = `Setor: ${setor.codigo} - ${setor.nome}\n` +
               `Localização: ${setor.localizacao || 'Não informado'}\n` +
               `Responsável: ${setor.responsavel ? setor.responsavel.nome : 'Não informado'}\n` +
               `Status: ${setor.ativo ? 'Ativo' : 'Inativo'}\n` +
               `Ativos: ${setor.estatisticas ? setor.estatisticas.total : 0}`
  alert(info)
}

const excluirSetor = async (setor) => {
  if (!confirm(`Deseja realmente excluir o setor ${setor.codigo} - ${setor.nome}?`)) {
    return
  }

  try {
    await api.delete(`/setores/${setor.id}`)
    success('Sucesso', 'Setor excluído com sucesso')
    await carregarSetores()
  } catch (err) {
    console.error('Erro ao excluir setor:', err)
    error('Erro', err.response?.data?.message || 'Não foi possível excluir o setor')
  }
}

const salvarSetor = async () => {
  try {
    salvando.value = true
    
    // Normalizar código
    formulario.value.codigo = formulario.value.codigo.toUpperCase()
    
    if (setorEdicao.value) {
      await api.put(`/setores/${setorEdicao.value.id}`, formulario.value)
      success('Sucesso', 'Setor atualizado com sucesso')
    } else {
      await api.post('/setores', formulario.value)
      success('Sucesso', 'Setor cadastrado com sucesso')
    }
    
    fecharModal()
    await carregarSetores()
  } catch (err) {
    console.error('Erro ao salvar setor:', err)
    error('Erro', err.response?.data?.message || 'Não foi possível salvar o setor')
  } finally {
    salvando.value = false
  }
}

const fecharModal = () => {
  modalAberto.value = false
  setorEdicao.value = null
}

// Lifecycle
onMounted(() => {
  carregarSetores()
  carregarUsuarios()
})
</script>

<style scoped>
.setores-page {
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
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.stats-label {
  color: var(--color-dark-gray);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.setores-filters {
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

.setores-table {
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

.status-badge.inactive {
  background: #f5f5f5;
  color: #666;
}

.ativo-count {
  font-weight: 600;
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
  max-width: 800px;
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
  padding: 2rem;
  box-sizing: border-box;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1rem;
  width: 100%;
  box-sizing: border-box;
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

.form-check-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-check-input {
  margin: 0;
}

.form-help {
  font-size: 0.8rem;
  color: var(--color-dark-gray);
  margin-top: 0.25rem;
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
  .setores-page {
    padding: 1rem;
  }
  
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
  
  .setores-filters {
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
    max-width: 95vw;
    margin: 1rem;
  }
}
</style>