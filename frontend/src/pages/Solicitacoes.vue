<template>
  <div class="solicitacoes-page">
    <header class="page-header">
      <h1>Solicitações de Serviço</h1>
      <div class="header-actions">
        <!-- Botões de administração (apenas para admins) -->
        <div v-if="isAdmin" class="admin-actions">
          <button 
            class="btn btn-category" 
            @click="$router.push('/categories')"
            title="Gerenciar Categorias"
          >
            <i class="fas fa-folder"></i>
            Categoria
          </button>
          <button 
            class="btn btn-subcategory" 
            @click="$router.push('/subcategories')"
            title="Gerenciar Subcategorias"
          >
            <i class="fas fa-list"></i>
            SubCategoria
          </button>
        </div>
        <button class="btn btn-primary" @click="abrirModalSolicitacao">
          <i class="fas fa-plus"></i>
          Nova Solicitação
        </button>
      </div>
    </header>

    <!-- Filtros -->
    <div class="filters-card">
      <div class="filters-grid">
        <div class="filter-group">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Buscar por número, título ou descrição..."
            class="form-input"
            @input="debouncedSearch"
          />
        </div>

        <div class="filter-group">
          <select v-model="filters.status" class="form-select" @change="loadSolicitacoes">
            <option value="">Todos os Status</option>
            <option value="aberta">Aberta</option>
            <option value="em_analise">Em Análise</option>
            <option value="aprovada">Aprovada</option>
            <option value="em_execucao">Em Execução</option>
            <option value="fechada">Fechada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div class="filter-group">
          <select v-model="filters.categoria" class="form-select" @change="loadSolicitacoes">
            <option value="">Todas as Categorias</option>
            <option value="predial">Predial</option>
            <option value="industrial">Industrial</option>
            <option value="ti">TI</option>
            <option value="infraestrutura">Infraestrutura</option>
          </select>
        </div>

        <div class="filter-group">
          <select v-model="filters.prioridade" class="form-select" @change="loadSolicitacoes">
            <option value="">Todas as Prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando solicitações...</p>
    </div>

    <!-- Lista de solicitações -->
    <div v-else-if="solicitacoes.length > 0" class="solicitacoes-grid">
      <div
        v-for="solicitacao in solicitacoes"
        :key="solicitacao.id"
        class="solicitacao-card"
        @click="$router.push(`/solicitacoes/${solicitacao.id}`)"
      >
        <div class="card-header">
          <span class="numero">{{ solicitacao.numero }}</span>
          <span class="status" :class="`status-${solicitacao.status}`">
            {{ formatStatus(solicitacao.status) }}
          </span>
        </div>

        <h3 class="titulo">{{ solicitacao.titulo }}</h3>
        
        <div class="card-details">
          <div class="detail-row">
            <span class="label">Categoria:</span>
            <span class="value">{{ formatCategoria(solicitacao.categoria) }}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Prioridade:</span>
            <span class="value prioridade" :class="`prioridade-${solicitacao.prioridade}`">
              {{ formatPrioridade(solicitacao.prioridade) }}
            </span>
          </div>
          
          <div class="detail-row">
            <span class="label">Solicitante:</span>
            <span class="value">{{ solicitacao.solicitante?.nome }}</span>
          </div>
          
          <div v-if="solicitacao.responsavel" class="detail-row">
            <span class="label">Responsável:</span>
            <span class="value">{{ solicitacao.responsavel.nome }}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Local:</span>
            <span class="value">{{ solicitacao.localizacao }}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Criada em:</span>
            <span class="value">{{ formatDate(solicitacao.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vazio -->
    <div v-else class="empty-state">
      <h3>Nenhuma solicitação encontrada</h3>
      <p>Não há solicitações que correspondam aos filtros selecionados.</p>
      <button class="btn btn-primary" @click="abrirModalSolicitacao">
        <i class="fas fa-plus"></i>
        Criar Primeira Solicitação
      </button>
    </div>

    <!-- Paginação -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button
        class="btn btn-outline"
        :disabled="pagination.currentPage === 1"
        @click="changePage(pagination.currentPage - 1)"
      >
        Anterior
      </button>
      
      <span class="page-info">
        Página {{ pagination.currentPage }} de {{ pagination.totalPages }}
        ({{ pagination.totalItems }} items)
      </span>
      
      <button
        class="btn btn-outline"
        :disabled="pagination.currentPage === pagination.totalPages"
        @click="changePage(pagination.currentPage + 1)"
      >
        Próxima
      </button>
    </div>

    <!-- Modal de Nova Solicitação -->
    <div v-if="showModalSolicitacao" class="modal-overlay" @click="fecharModalSolicitacao">
      <div class="modal-container modal-solicitacao" @click.stop>
        <div class="modal-header">
          <h2>{{ isEdit ? 'Editar Solicitação' : 'Nova Solicitação' }}</h2>
          <button @click="fecharModalSolicitacao" class="modal-close">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="submitForm" class="solicitacao-form">
            
            <!-- 1. Setor -->
            <div class="form-group">
              <label for="setor">Setor *</label>
              <select 
                id="setor" 
                v-model="form.setor_id" 
                class="form-select" 
                required
                @change="onSetorChange"
              >
                <option value="">Selecione o setor</option>
                <option 
                  v-for="setor in setores" 
                  :key="setor.id" 
                  :value="setor.id"
                >
                  {{ setor.codigo }} - {{ setor.nome }} ({{ setor.total_ativos ?? 0 }})
                </option>
              </select>
            </div>

            <!-- 2. Ativo -->
            <div class="form-group">
              <label for="ativo">Ativo *</label>
              <select 
                id="ativo" 
                v-model="form.ativo_id" 
                class="form-select"
                required
                :disabled="!form.setor_id || ativosCarregando"
              >
                <option value="" v-if="!form.setor_id">Selecione primeiro o setor</option>
                <option value="" v-else-if="ativosCarregando">Carregando ativos...</option>
                <option value="" v-else-if="form.setor_id && !ativosCarregando && ativosFiltrados.length === 0">Nenhum ativo neste setor</option>
                <template v-else>
                  <option 
                    v-for="ativo in ativosFiltrados" 
                    :key="ativo.id" 
                    :value="ativo.id"
                  >
                    {{ ativo.codigo }} - {{ ativo.nome }}
                  </option>
                </template>
              </select>
              <small class="form-help" v-if="form.setor_id && ativosFiltrados.length === 0 && !ativosCarregando">Cadastre um ativo para este setor antes de prosseguir</small>
              <small class="form-help" v-else>Selecione o ativo relacionado à solicitação</small>
            </div>

            <!-- 3. Categoria -->
            <div class="form-group">
              <label for="categoria">Categoria *</label>
              <select 
                id="categoria" 
                v-model="form.category_id" 
                class="form-select" 
                required
                @change="onCategoryChange"
              >
                <option value="">Selecione a categoria</option>
                <option 
                  v-for="categoria in categorias" 
                  :key="categoria.id" 
                  :value="categoria.id"
                >
                  {{ categoria.nome }}
                </option>
              </select>
            </div>

            <!-- 4. Subcategoria -->
            <div class="form-group">
              <label for="subcategoria">Subcategoria *</label>
              <select 
                id="subcategoria" 
                v-model="form.subcategory_id" 
                class="form-select"
                :disabled="!form.category_id"
                required
              >
                <option value="">Selecione a subcategoria</option>
                <option 
                  v-for="subcategoria in subcategoriasDisponiveis" 
                  :key="subcategoria.id" 
                  :value="subcategoria.id"
                >
                  {{ subcategoria.nome }}
                </option>
              </select>
            </div>

            <!-- 5. Título -->
            <div class="form-group">
              <label for="titulo">Título da Solicitação *</label>
              <input
                id="titulo"
                v-model="form.titulo"
                type="text"
                class="form-input"
                required
                placeholder="Descreva brevemente o problema ou necessidade"
                maxlength="200"
              />
              <span class="char-count">{{ form.titulo.length }}/200</span>
            </div>

            <!-- 6. Descrição -->
            <div class="form-group">
              <label for="descricao">Descrição Detalhada *</label>
              <textarea
                id="descricao"
                v-model="form.descricao"
                class="form-textarea"
                required
                placeholder="Descreva detalhadamente o problema, necessidade ou solicitação..."
                rows="4"
                maxlength="1000"
              ></textarea>
              <span class="char-count">{{ form.descricao.length }}/1000</span>
            </div>

            <!-- 7. Prioridade -->
            <div class="form-group">
              <label for="prioridade">Prioridade *</label>
              <select 
                id="prioridade" 
                v-model="form.prioridade" 
                class="form-select" 
                required
              >
                <option value="baixa">Baixa</option>
                <option value="normal" selected>Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" @click="fecharModalSolicitacao">
            Cancelar
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            @click="submitForm"
            :disabled="salvando"
          >
            <i v-if="salvando" class="fas fa-spinner fa-spin"></i>
            {{ salvando ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Solicitação') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { success, error } = useToast()

const solicitacoes = ref([])
const loading = ref(false)

// Modal de Nova Solicitação
const showModalSolicitacao = ref(false)
const isEdit = ref(false)
const salvando = ref(false)
const ativosCarregando = ref(false)

// Dados para o formulário
const setores = ref([])
const ativosFiltrados = ref([])
const categorias = ref([])
const subcategorias = ref([])

// Formulário
const form = reactive({
  setor_id: '',
  ativo_id: '',
  category_id: '',
  subcategory_id: '',
  titulo: '',
  descricao: '',
  prioridade: 'normal'
})

// Verificar se o usuário é administrador
const isAdmin = computed(() => {
  return authStore.user?.perfil === 'administrador'
})

// Computed para subcategorias disponíveis
const subcategoriasDisponiveis = computed(() => {
  if (!form.category_id) return []
  return subcategorias.value.filter(sub => sub.category_id === form.category_id)
})

const filters = reactive({
  search: '',
  status: '',
  categoria: '',
  prioridade: ''
})

const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 12
})

// Debounce para busca
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadSolicitacoes()
  }, 500)
}

const loadSolicitacoes = async () => {
  try {
    loading.value = true
    
    const params = {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      search: filters.search,
      status: filters.status,
      categoria: filters.categoria,
      prioridade: filters.prioridade
    }

    // Remove parâmetros vazios
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const response = await api.get('/solicitacoes', { params })

    if (response.data.success) {
      solicitacoes.value = response.data.data.solicitacoes
      Object.assign(pagination, response.data.data.pagination)
    }

  } catch (err) {
    console.error('Erro ao carregar solicitações:', err)
    error('Erro ao carregar solicitações', 'Não foi possível carregar a lista de solicitações')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  pagination.currentPage = page
  loadSolicitacoes()
}

// Métodos do Modal de Solicitação
const abrirModalSolicitacao = () => {
  showModalSolicitacao.value = true
  isEdit.value = false
  resetForm()
  carregarDadosFormulario()
}

const fecharModalSolicitacao = () => {
  showModalSolicitacao.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    setor_id: '',
    ativo_id: '',
    category_id: '',
    subcategory_id: '',
    titulo: '',
    descricao: '',
    prioridade: 'normal'
  })
  ativosFiltrados.value = []
}

const carregarDadosFormulario = async () => {
  try {
    // Carregar setores
    const setorResponse = await api.get('/setores/ativos')
    setores.value = setorResponse.data.data.setores

  // Carregar categorias ativas com subcategorias
  const catResponse = await api.get('/categories/active')
  categorias.value = catResponse.data.data.categorias || []
  // Extrair subcategorias agrupadas
  subcategorias.value = categorias.value.flatMap(c => (c.subcategorias || []).map(s => ({ ...s, category_id: c.id })))
  } catch (err) {
    console.error('Erro ao carregar dados do formulário:', err)
    error('Erro ao carregar dados do formulário')
  }
}

const onSetorChange = async () => {
  form.ativo_id = ''
  ativosFiltrados.value = []
  
  if (!form.setor_id) return
  
  try {
    ativosCarregando.value = true
    const response = await api.get('/ativos', {
      params: { setor_id: form.setor_id, limit: 200 }
    })
    if (response.data.success) {
      ativosFiltrados.value = response.data.data.ativos || []
    } else {
      ativosFiltrados.value = []
    }
  } catch (err) {
    console.error('Erro ao carregar ativos:', err)
    error('Erro ao carregar ativos do setor')
  } finally {
    ativosCarregando.value = false
  }
}

const onCategoryChange = () => {
  form.subcategory_id = ''
}

const submitForm = async () => {
  try {
    salvando.value = true
    
    // Validação adicional
    if (!form.category_id) {
      error('Categoria obrigatória')
      salvando.value = false
      return
    }
    if (!form.subcategory_id) {
      error('Subcategoria obrigatória')
      salvando.value = false
      return
    }

    const payload = {
      titulo: form.titulo,
      descricao: form.descricao,
      category_id: form.category_id,
      subcategory_id: form.subcategory_id,
      prioridade: form.prioridade,
      ativo_id: form.ativo_id,
      setor_id: form.setor_id
    }

    if (isEdit.value) {
      await api.put(`/solicitacoes/${form.id}`, payload)
      success('Solicitação atualizada com sucesso!')
    } else {
      await api.post('/solicitacoes', payload)
      success('Solicitação criada com sucesso!')
    }

    fecharModalSolicitacao()
    loadSolicitacoes()
  } catch (err) {
    console.error('Erro ao salvar solicitação:', err)
    error('Erro ao salvar solicitação')
  } finally {
    salvando.value = false
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

onMounted(() => {
  loadSolicitacoes()
})
</script>

<style scoped>
.solicitacoes-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-category {
  background: #3498db;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-category:hover {
  background: #28a745;
  transform: translateY(-1px);
}

.btn-subcategory {
  background: #3498db;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-subcategory:hover {
  background: #28a745;
  transform: translateY(-1px);
}

.page-header h1 {
  color: var(--primary-color);
  font-size: 2rem;
  margin: 0;
}

.filters-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.loading-container {
  text-align: center;
  padding: 3rem;
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

.solicitacoes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.solicitacao-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.solicitacao-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.numero {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.9rem;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-aberta { background: #e3f2fd; color: #1976d2; }
.status-em_analise { background: #fff3e0; color: #f57c00; }
.status-aprovada { background: #e8f5e8; color: #388e3c; }
.status-em_execucao { background: #f3e5f5; color: #7b1fa2; }
.status-fechada { background: #f5f5f5; color: #616161; }
.status-cancelada { background: #ffebee; color: #d32f2f; }

.titulo {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.value {
  font-size: 0.9rem;
  color: var(--text-primary);
  text-align: right;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prioridade {
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}

.prioridade-baixa { background: #e8f5e8; color: #388e3c; }
.prioridade-normal { background: #e3f2fd; color: #1976d2; }
.prioridade-alta { background: #fff3e0; color: #f57c00; }
.prioridade-critica { background: #ffebee; color: #d32f2f; }

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.empty-state h3 {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #28a745;
  transform: translateY(-1px);
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .solicitacoes-page {
    padding: 1rem;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .solicitacoes-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}

/* Modal de Solicitação */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  width: 95%;
  max-width: 900px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-solicitacao {
  width: 90%;
  max-width: 800px;
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
  font-size: 1.5rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-gray-dark);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--color-light-gray);
  color: var(--color-primary);
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1.5rem;
  background: var(--color-background);
  border-top: 1px solid var(--color-light-gray);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.solicitacao-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--color-gray-dark);
  font-size: 0.9rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-light-gray);
  border-radius: var(--border-radius-md);
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: var(--color-white);
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
}

.form-select:disabled {
  background: var(--color-background);
  color: var(--color-gray);
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.form-help {
  color: var(--color-gray);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.char-count {
  font-size: 0.8rem;
  color: var(--color-gray);
  text-align: right;
}

@media (max-width: 768px) {
  .modal-solicitacao {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .modal-footer .btn {
    width: 100%;
  }
}
</style>